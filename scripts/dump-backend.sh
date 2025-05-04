#!/usr/bin/env bash
set -e

#
# scripts/dump-backend.sh
#

# 1) find project root via Git
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# 2) prepare dumps folder
DUMP_DIR="$PROJECT_ROOT/scripts/dumps"
mkdir -p "$DUMP_DIR"
OUT="$DUMP_DIR/all-backend.txt"

# 3) hard-coded list of files to include (relative to PROJECT_ROOT)
FILES=(
  # new config
  "backend/config/restaurant.php"

  # controllers
  "backend/app/Http/Controllers/BookingController.php"
  "backend/app/Http/Controllers/Controller.php"
  "backend/app/Http/Controllers/TableAvailabilityController.php"

  # resources
  "backend/app/Http/Resources/BookingDetailResource.php"
  "backend/app/Http/Resources/BookingResource.php"
  "backend/app/Http/Resources/TableAvailabilityResource.php"
  "backend/app/Http/Kernel.php"

  # mail
  "backend/app/Mail/BookingConfirmationMail.php"
  "backend/app/Mail/BookingFeedbackMail.php"
  "backend/app/Mail/BookingReminderMail.php"

  # models
  "backend/app/Models/Booking.php"
  "backend/app/Models/BookingDetail.php"
  "backend/app/Models/TableAvailability.php"
  "backend/app/Models/User.php"

  # only BookingAlgorithmService remains
  "backend/app/Services/BookingAlgorithmService.php"

  # migrations
  "backend/database/migrations/2025_02_03_191203_create_table_availabilities_table.php"
  "backend/database/migrations/2025_02_04_115733_create_bookings_table.php"
  "backend/database/migrations/2025_02_26_163537_create_booking_details_table.php"
  "backend/database/migrations/2025_02_27_174815_create_jobs_table.php"
  "backend/database/migrations/2025_04_20_143322_add_long_stay_to_bookings_table.php"

  # seeders
  "backend/database/seeders/BookingSeeder.php"
  "backend/database/seeders/DatabaseSeeder.php"
  "backend/database/seeders/TableAvailabilitySeeder.php"

  # routes
  "backend/routes/api.php"

  # config-important directory (all .php in it)
  "backend/config/mail.php"
  "backend/config/restaurant.php"
  "backend/config/restaurant_dataset.php"
)

# 4) sanity check
if [[ ! -d "$PROJECT_ROOT/backend" ]]; then
  echo "❌ Error: backend/ directory not found under $PROJECT_ROOT"
  exit 1
fi

# 5) header tree
echo "└── backend" > "$OUT"
for F in "${FILES[@]}"; do
  REL="${F#backend/}"
  echo "    ├── $REL"
done >> "$OUT"
echo >> "$OUT"

# 6) dump each file
for F in "${FILES[@]}"; do
  FULL="$PROJECT_ROOT/$F"
  if [[ ! -f "$FULL" ]]; then
    echo "⚠️ Warning: missing file $F" >> "$OUT"
    continue
  fi

  echo "––––––––––––––––––––––––" >> "$OUT"
  echo "$F"                       >> "$OUT"
  sed 's/^/    /' "$FULL"        >> "$OUT"
  echo                           >> "$OUT"
done

echo "✅ Backend dump written to: $OUT"
