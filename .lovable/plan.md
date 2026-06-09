Implement improvements to the "Fale com o Nutri" channel to ensure active students are correctly recognized and handled.

### Database Improvements
- Create a database function `normalize_phone_number` to help with phone searches.
- Add a trigger to keep a `normalized_phone` column updated in the `profiles` table (optional but recommended for performance; for now, I will stick to memory filtering for simplicity and robustness).
- Actually, I will modify the Edge Function to fetch all potential matches based on the last 8 digits and then perform a robust scoring/matching in TypeScript.

### Logic Improvements in `crm-inbound-webhook`
- Update `phoneCandidates` to be more aggressive with the Brazilian 9th digit.
- Update `findProfileByPhone` to:
  - Search for the last 8 digits as a baseline pattern.
  - Fetch up to 50 potential matches.
  - Rank them using a sophisticated distance algorithm (e.g., matching the most digits).
- Update the Nutri channel flow:
  - Add logic to handle the main menu options (1, 2, 3, 4, 5) for the `nutri_main` state.
  - Ensure that when an active student is recognized, they are greeted correctly and given the Nutri menu.
- Add detailed auditing logs for the identification process, showing which phone candidates were tried and what was found.

### Automated Tests
- Update `phone_test.ts` to include the specific case of the missing 9th digit that failed (556493070839 -> (64) 99307-0839).
- Add a new test file `recognition.test.ts` to simulate the full profile finding logic.

Technical Details:
- The last 8 digits are the most stable part of a Brazilian phone number.
- Using `ilike %last8%` will fetch all candidates regardless of DDD or 9th digit.
- TypeScript ranking will then check the DDD and 9th digit to find the best match.
