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
#app
  # actions
  "backend/app/Actions/MakeTenantCurrentAction.php"

  #http
    # controllers
    "backend/app/Http/Controllers/BookingController.php"
    "backend/app/Http/Controllers/Controller.php"
    "backend/app/Http/Controllers/TableAvailabilityController.php"
    "backend/app/Http/Controllers/OpenDayController.php"
    "backend/app/Http/Controllers/ClosedDayController.php"
    "backend/app/Http/Controllers/SystemSettingController.php"
    "backend/app/Http/Controllers/MetaController.php"
    "backend/app/Http/Controllers/MealOverrideController.php"

    # resources
    "backend/app/Http/Resources/BookingDetailResource.php"
    "backend/app/Http/Resources/BookingResource.php"
    "backend/app/Http/Resources/TableAvailabilityResource.php"

    # kernel
    "backend/app/Http/Kernel.php"

  # jobs
  "backend/app/Jobs/ProvisionTenant.php"

  # mail
  "backend/app/Mail/BookingConfirmationMail.php"
  "backend/app/Mail/BookingFeedbackMail.php"
  "backend/app/Mail/BookingReminderMail.php"

  # models
  "backend/app/Models/Booking.php"
  "backend/app/Models/MealOverride.php"
  "backend/app/Models/BookingDetail.php"
  "backend/app/Models/TableAvailability.php"
  "backend/app/Models/User.php"
  "backend/app/Models/ClosedDay.php"
  "backend/app/Models/OpenDay.php"
  "backend/app/Models/SystemSetting.php"
  "backend/app/Models/Tenant.php"

  # observers
  "backend/app/Observers/TenantObserver.php"

  # providers
  "backend/app/Providers/EventServiceProvider.php"
  "backend/app/Providers/RouteServiceProvider.php"

  # services
  "backend/app/Services/BookingAlgorithmService.php"
  "backend/app/Services/CalendarService.php"

  # tenancy
  "backend/app/Tenancy/SlugTenantFinder.php"

#--------------------------------------------------------------------------------------------------

#config
  # config-important directory (all .php in it)
  "backend/config/mail.php"
  "backend/config/restaurant.php"
  "backend/config/restaurant_dataset.php"
  "backend/config/multitenancy.php"
  "backend/config/restaurant.php"
  "backend/config/database.php"

#--------------------------------------------------------------------------------------------------

#database
  # factories
  "backend/database/factories/UserFactory.php"

  # migrations
      # landlord
      "backend/database/migrations/landlord/2025_07_01_103528_create_landlord_tenants_table.php"

  "backend/database/migrations/2025_02_03_191203_create_table_availabilities_table.php"
  "backend/database/migrations/2025_02_04_115733_create_bookings_table.php"
  "backend/database/migrations/2025_02_26_163537_create_booking_details_table.php"
  "backend/database/migrations/2025_02_27_174815_create_jobs_table.php"
  "backend/database/migrations/2025_04_20_143322_add_long_stay_to_bookings_table.php"
  "backend/database/migrations/2025_05_04_155326_create_closed_days_table.php"
  "backend/database/migrations/2025_05_04_155330_create_system_settings_table.php"
  "backend/database/migrations/2025_05_04_182837_create_calendar_overrides_table.php"
  "backend/database/migrations/2025_05_04_184511_create_open_days_table.php"
  "backend/database/migrations/2025_05_12_081618_add_room_to_table_availabilities_table.php"
  "backend/database/migrations/2025_07_01_104245_create_tenants_table.php"

  # seeders
  "backend/database/seeders/BookingSeeder.php"
  "backend/database/seeders/DatabaseSeeder.php"
  "backend/database/seeders/TableAvailabilitySeeder.php"
  "backend/database/seeders/ReallocateBookingsSeeder.php"

#--------------------------------------------------------------------------------------------------

#routes
  "backend/routes/api.php"
  "backend/routes/admin.php"
  "backend/routes/booking.php"


#--------------------------------------------------------------------------------------------------
#env
"backend/.env"

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
