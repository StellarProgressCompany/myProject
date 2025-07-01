<?php

use Spatie\Multitenancy\Models\Tenant;
use Spatie\Multitenancy\Actions\ForgetCurrentTenantAction;
use App\Actions\MakeTenantCurrentAction;
use Spatie\Multitenancy\Actions\MakeQueueTenantAwareAction;
use Spatie\Multitenancy\Actions\MigrateTenantAction;
use Illuminate\Broadcasting\BroadcastEvent;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Mail\SendQueuedMailable;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Queue\CallQueuedClosure;

return [

    /*
    |--------------------------------------------------------------------------
    | Tenant discovery
    |--------------------------------------------------------------------------
    */
    'tenant_finder' => App\Tenancy\SlugTenantFinder::class,

    /*
    |--------------------------------------------------------------------------
    | Database connections
    |--------------------------------------------------------------------------
    */
    'tenant_database_connection_name'   => 'tenant',
    'landlord_database_connection_name' => 'mysql',

    /*
    |--------------------------------------------------------------------------
    | When the package needs to “make a tenant current”, it will run these
    | actions.  We swap the default for our own class that rewires the
    | connection string.
    |--------------------------------------------------------------------------
    */
    'actions' => [
        'make_tenant_current_action'   => MakeTenantCurrentAction::class,
        'forget_current_tenant_action' => ForgetCurrentTenantAction::class,
        'make_queue_tenant_aware_action' => MakeQueueTenantAwareAction::class,
        'migrate_tenant'               => MigrateTenantAction::class,
    ],

    /*---------------------------------------------------------------------------*/

    'tenant_model'                       => Tenant::class,
    'queues_are_tenant_aware_by_default' => true,
    'current_tenant_container_key'       => 'currentTenant',
    'shared_routes_cache'                => false,

    'tenant_aware_jobs'     => [],
    'not_tenant_aware_jobs' => [],

    'queueable_to_job' => [
        SendQueuedMailable::class       => 'mailable',
        SendQueuedNotifications::class  => 'notification',
        CallQueuedClosure::class        => 'closure',
        CallQueuedListener::class       => 'class',
        BroadcastEvent::class           => 'event',
    ],
];
