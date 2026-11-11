<?php

namespace App\Http\Controllers\Api\Mom;

use App\Http\Controllers\Controller;
use App\Services\MomDocument;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * MOM Writer address book.
 *
 *   GET    /api/backoffice/mom-contacts?q=
 *   POST   /api/backoffice/mom-contacts   {name, email, role} or {items: [...]}
 *                                         (an existing email updates that contact)
 *   PUT    /api/backoffice/mom-contacts/{id}
 *   DELETE /api/backoffice/mom-contacts/{id}
 */
class MomContactController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = MomDocument::clip($request->query('q'), 200);
        $query = DB::table('mom_contacts');
        if ($q !== '') {
            $like = MomDocument::likeValue($q);
            $query->where(function ($w) use ($like) {
                $w->whereRaw("name LIKE ? ESCAPE '!'", [$like])
                    ->orWhereRaw("email LIKE ? ESCAPE '!'", [$like])
                    ->orWhereRaw("role LIKE ? ESCAPE '!'", [$like]);
            });
        }

        $items = $query->orderBy('name')->orderBy('id')->limit(2000)
            ->get(['id', 'name', 'email', 'role'])
            ->map(fn ($r) => $this->present($r));

        return response()->json(['status' => true, 'items' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->has('items')) {
            $items = $request->input('items');
            if (! is_array($items) || count($items) > 500) {
                return $this->error(422, 'bad_data', 'รายการไม่ถูกต้อง');
            }
            $clean = array_map(fn ($c) => $this->clean($c), $items);
            $ids = DB::transaction(fn () => array_map(fn ($c) => $this->upsert($c), $clean));

            return response()->json(['status' => true, 'ids' => $ids], 201);
        }

        $id = $this->upsert($this->clean($request->all()));

        return response()->json(['status' => true] + $this->one($id), 201);
    }

    public function update(Request $request, int $contact): JsonResponse
    {
        $data = $this->clean($request->all());
        $this->one($contact);

        try {
            DB::table('mom_contacts')->where('id', $contact)->update($data + ['updated_at' => now()]);
        } catch (QueryException $e) {
            if ($e instanceof UniqueConstraintViolationException || $e->getCode() === '23000') {
                return $this->error(409, 'duplicate_email', 'อีเมลนี้มีอยู่ในสมุดรายชื่อแล้ว');
            }
            throw $e;
        }

        return response()->json(['status' => true] + $this->one($contact));
    }

    public function destroy(int $contact): JsonResponse
    {
        if (DB::table('mom_contacts')->where('id', $contact)->delete() === 0) {
            return $this->error(404, 'not_found', 'ไม่พบรายชื่อนี้');
        }

        return response()->json(['status' => true]);
    }

    /** @return array{name:string, email:?string, role:?string} */
    private function clean(mixed $c): array
    {
        if (! is_array($c)) {
            $this->fail(422, 'bad_data', 'ข้อมูลรายชื่อไม่ถูกต้อง');
        }
        $name = MomDocument::clip($c['name'] ?? '', 255);
        $email = mb_strtolower(MomDocument::clip($c['email'] ?? '', 255));
        $role = MomDocument::clip($c['role'] ?? '', 255);

        if ($name === '') {
            $this->fail(422, 'name_required', 'กรุณาใส่ชื่อ');
        }
        if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->fail(422, 'bad_email', 'รูปแบบอีเมลไม่ถูกต้อง: '.$email);
        }

        return ['name' => $name, 'email' => $email === '' ? null : $email, 'role' => $role === '' ? null : $role];
    }

    /** Create the contact, or update the one with the same email. */
    private function upsert(array $c): int
    {
        if ($c['email'] !== null) {
            $found = DB::table('mom_contacts')->where('email', $c['email'])->value('id');
            if ($found !== null) {
                $changes = ['name' => $c['name'], 'updated_at' => now()];
                if ($c['role'] !== null) {
                    $changes['role'] = $c['role'];
                }
                DB::table('mom_contacts')->where('id', $found)->update($changes);

                return (int) $found;
            }
        }
        $now = now();

        return (int) DB::table('mom_contacts')->insertGetId($c + ['created_at' => $now, 'updated_at' => $now]);
    }

    private function one(int $id): array
    {
        $row = DB::table('mom_contacts')->where('id', $id)->first(['id', 'name', 'email', 'role']);
        if (! $row) {
            $this->fail(404, 'not_found', 'ไม่พบรายชื่อนี้');
        }

        return $this->present($row);
    }

    private function present(object $r): array
    {
        return ['id' => (int) $r->id, 'name' => $r->name, 'email' => $r->email, 'role' => $r->role];
    }

    private function error(int $status, string $error, string $message): JsonResponse
    {
        return response()->json(['status' => false, 'error' => $error, 'message' => $message], $status);
    }

    private function fail(int $status, string $error, string $message): never
    {
        throw new HttpResponseException($this->error($status, $error, $message));
    }
}
