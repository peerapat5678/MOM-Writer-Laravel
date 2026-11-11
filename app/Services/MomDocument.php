<?php

namespace App\Services;

use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validates a MOM Writer document (the JSON the page edits) and derives the
 * columns stored next to it for listing and searching.
 */
class MomDocument
{
    public const STATUS_DONE = 'เสร็จแล้ว';

    /**
     * @return array{title:string, meeting_date:?string, location:?string, recorder:?string, open_actions:int, search_text:string, data:string}
     */
    public function derive(mixed $data): array
    {
        if (! is_array($data)) {
            $this->fail('bad_data', 'ข้อมูล MOM ไม่ครบ');
        }

        $title = self::clip($data['title'] ?? '', 255);
        if ($title === '') {
            $this->fail('title_required', 'กรุณาตั้งชื่อการประชุม');
        }
        if (! isset($data['sections']) || ! is_array($data['sections'])) {
            $this->fail('bad_data', 'ข้อมูล MOM ไม่ครบ');
        }

        $date = $data['date'] ?? null;
        if (! is_string($date) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = null;
        }

        $search = [$title];
        $open = 0;
        foreach ($data['sections'] as $section) {
            if (! is_array($section)) {
                continue;
            }
            $items = is_array($section['items'] ?? null) ? $section['items'] : [];
            foreach ($items as $item) {
                if (! is_array($item)) {
                    continue;
                }
                switch ($section['type'] ?? '') {
                    case 'attendees':
                        $search[] = ($item['name'] ?? '').' '.($item['email'] ?? '').' '.($item['role'] ?? '');
                        break;
                    case 'agenda':
                        $search[] = (string) ($item['topic'] ?? '');
                        break;
                    case 'actions':
                        if (trim((string) ($item['task'] ?? '')) !== '' && ($item['status'] ?? '') !== self::STATUS_DONE) {
                            $open++;
                        }
                        $search[] = ($item['task'] ?? '').' '.($item['owner'] ?? '');
                        break;
                }
            }
        }

        unset($data['id']);

        return [
            'title' => $title,
            'meeting_date' => $date,
            'location' => self::clip($data['location'] ?? '', 255) ?: null,
            'recorder' => self::clip($data['recorder'] ?? '', 255) ?: null,
            'open_actions' => min($open, 65535),
            'search_text' => mb_substr(trim((string) preg_replace('/\s+/u', ' ', implode(' ', array_map('strval', $search)))), 0, 20000),
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ];
    }

    public static function clip(mixed $value, int $max): string
    {
        return mb_substr(is_string($value) ? trim($value) : '', 0, $max);
    }

    /** LIKE pattern with wildcards escaped; use with "col LIKE ? ESCAPE '!'". */
    public static function likeValue(string $term): string
    {
        return '%'.preg_replace('/[!%_\[]/', '!$0', $term).'%';
    }

    private function fail(string $error, string $message): never
    {
        throw new HttpResponseException(response()->json(
            ['status' => false, 'error' => $error, 'message' => $message],
            422,
        ));
    }
}
