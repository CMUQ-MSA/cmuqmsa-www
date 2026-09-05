# Program photo galleries

Each program has its own folder and carousel. Aim for **3–5 photos per program**.

## Adding photos

1. Put the image in the matching program folder.
2. Name it with the folder slug and a two-digit sequence number, such as
   `trips-02.jpg` or `karak-and-kookies-04.webp`.
3. Add it to that gallery's `photos` list in `galleries.js`. The list order is
   the carousel order.
4. Write a short, specific `alt` description of what is happening in the photo.
5. Optionally set `position` to adjust the crop, such as `center 35%`.

The page and carousel code do not need to change when photos are added.

## Photo preparation

- Prefer landscape photos; the site displays them in a 16:10 frame.
- JPEG, PNG, WebP, and AVIF are supported.
- Keep the longest edge at or below 1800 pixels when possible.
- Aim for less than 500 KB per image so the galleries stay quick on mobile.
- Do not stretch, heavily filter, or add text over photos.
