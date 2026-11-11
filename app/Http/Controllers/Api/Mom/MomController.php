<?php

namespace App\Http\Controllers\Api\Mom;

use App\Http\Controllers\Controller;
use App\Services\MomDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * MOM Writer: meeting minutes shared by everyone signed in to the backoffice.
 *
 *   GET    /api/backoffice/moms?q=&limit=&offset=   list (newest meeting first)
 *   GET    /api/backoffice/moms/{id}                one MOM with its document
 *   POST   /api/backoffice/moms        {data}       create
 *   PUT    /api/backoffice/moms/{id}   {data, version, force?}
 *                                                    update; 409 when version is stale
 *   DELETE /api/backoffice/moms/{id}                soft delete
 *   POST   /api/backoffice/moms/{id}/restore        undo a delete
 */
class MomController extends Controller
{
    private const MAX_BODY_BYTES = 5_000_000;   // signatures are images inside the document

    public function __construct(private MomDocument $document)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $q = MomDocument::clip($request->query('q'), 200);
        $limit = max(1, min(500, (int) $request->query('limit', 100)));
        $offset = max(0, (int) $request->query('offset', 0));

        $query = DB::table('moms')->whereNull('deleted_at');
        if ($q !== '') {
            $like = MomDocument::likeValue($q);
            $query->where(function ($w) use ($like) {
                $w->whereRaw("title LIKE ? ESCAPE '!'", [$like])
                    ->orWhereRaw("search_text LIKE ? ESCAPE '!'", [$like]);
            });
        }

        $total = (clone $query)->count();
        $items = $query
            ->orderByRaw('CASE WHEN meeting_date IS NULL THEN 1 ELSE 0 END')
            ->orderByDesc('meeting_date')->orderByDesc('updated_at')->orderByDesc('id')
            ->offset($offset)->limit($limit)
            ->get(['id', 'title', 'meeting_date', 'location', 'recorder', 'open_actions', 'version', 'updated_by', 'updated_at'])
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'title' => $r->title,
                'meeting_date' => $r->meeting_date ? substr((string) $r->meeting_date, 0, 10) : null,
                'location' => $r->location,
                'recorder' => $r->recorder,
                'open_actions' => (int) $r->open_actions,
                'version' => (int) $r->version,
                'updated_by' => $r->updated_by,
                'updated_at' => (string) $r->updated_at,
            ]);

        return response()->json(['status' => true, 'items' => $items, 'total' => $total]);
    }

    public function show(int $mom): JsonResponse
    {
        $row = DB::table('moms')->where('id', $mom)->whereNull('deleted_at')->first();
        if (! $row) {
            return $this->error(404, 'not_found', 'ไม่พบ MOM นี้');
        }

        return response()->json([
            'status' => true,
            'id' => (int) $row->id,
            'version' => (int) $row->version,
            'created_by' => $row->created_by,
            'updated_by' => $row->updated_by,
            'created_at' => (string) $row->created_at,
            'updated_at' => (string) $row->updated_at,
            'data' => json_decode($row->data, true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->guardSize($request);
        $columns = $this->document->derive($request->input('data'));
        $user = $this->employeeCode($request);
        $now = now();

        $id = DB::table('moms')->insertGetId($columns + [
            'version' => 1,
            'created_by' => $user,
            'updated_by' => $user,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return response()->json($this->meta((int) $id), 201);
    }

    public function update(Request $request, int $mom): JsonResponse
    {
        $this->guardSize($request);
        $columns = $this->document->derive($request->input('data'));
        $force = $request->boolean('force');

        $query = DB::table('moms')->where('id', $mom)->whereNull('deleted_at');
        if (! $force) {
            $query->where('version', (int) $request->input('version', 0));
        }
        $changed = $query->update($columns + [
            'version' => DB::raw('version + 1'),
            'updated_by' => $this->employeeCode($request),
            'updated_at' => now(),
        ]);

        if ($changed === 0) {
            $current = DB::table('moms')->where('id', $mom)->whereNull('deleted_at')->value('version');
            if ($current === null) {
                return $this->error(404, 'not_found', 'ไม่พบ MOM นี้ (อาจถูกลบไปแล้ว)');
            }
            if (! $force) {
                return response()->json([
                    'status' => false,
                    'error' => 'conflict',
                    'message' => 'มีการแก้ไข MOM นี้จากที่อื่น',
                    'version' => (int) $current,
                ], 409);
            }
        }

        return response()->json($this->meta($mom));
    }

    public function destroy(Request $request, int $mom): JsonResponse
    {
        $changed = DB::table('moms')->where('id', $mom)->whereNull('deleted_at')->update([
            'deleted_at' => now(),
            'updated_by' => $this->employeeCode($request),
        ]);
        if ($changed === 0) {
            return $this->error(404, 'not_found', 'ไม่พบ MOM นี้');
        }

        return response()->json(['status' => true]);
    }

    public function restore(Request $request, int $mom): JsonResponse
    {
        $changed = DB::table('moms')->where('id', $mom)->whereNotNull('deleted_at')->update([
            'deleted_at' => null,
            'version' => DB::raw('version + 1'),
            'updated_by' => $this->employeeCode($request),
            'updated_at' => now(),
        ]);
        if ($changed === 0) {
            return $this->error(404, 'not_found', 'ไม่พบ MOM ที่ถูกลบ');
        }

        return response()->json($this->meta($mom));
    }

    private function meta(int $id): array
    {
        $row = DB::table('moms')->where('id', $id)->first(['id', 'version', 'updated_at']);

        return [
            'status' => true,
            'id' => (int) $row->id,
            'version' => (int) $row->version,
            'updated_at' => (string) $row->updated_at,
        ];
    }

    private function employeeCode(Request $request): ?string
    {
        $code = $request->attributes->get('employee_code');

        return $code === null ? null : mb_substr((string) $code, 0, 50);
    }

    private function guardSize(Request $request): void
    {
        if (strlen((string) $request->getContent()) > self::MAX_BODY_BYTES) {
            abort($this->error(413, 'too_large', 'ข้อมูลใหญ่เกินกำหนด'));
        }
    }

    private function error(int $status, string $error, string $message): JsonResponse
    {
        return response()->json(['status' => false, 'error' => $error, 'message' => $message], $status);
    }
}
