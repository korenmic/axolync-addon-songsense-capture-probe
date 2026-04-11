function normalizeSetting(setting) {
  return {
    setting_id: String(setting.settingId ?? setting.setting_id),
    label: String(setting.label),
    kind: String(setting.kind),
    ...(typeof setting.description === 'string' ? { description: setting.description } : {}),
    hidden_in_ui: setting.hiddenInUi === true,
    ...(Object.hasOwn(setting, 'defaultValue') ? { default_value: setting.defaultValue } : {}),
    ...(Array.isArray(setting.enumValues) ? { enum_values: [...setting.enumValues] } : {}),
    ...(setting.optionSource ? {
      option_source: {
        surface_id: setting.optionSource.surfaceId,
        section_id: setting.optionSource.sectionId,
      },
    } : {}),
  };
}

function normalizeAction(action) {
  return {
    action_id: action.actionId,
    label: action.label,
    description: action.description,
    category: action.category,
    destructive: action.destructive === true,
    cancellable: action.cancellable === true,
    progress_capable: action.progressCapable === true,
    confirmation_required: action.confirmationRequired === true,
    handler: {
      module_path: action.bundlePath,
      export_name: action.handler.name,
    },
  };
}

function normalizeRuntimeSurface(surface) {
  return {
    surface_id: surface.surfaceId,
    label: surface.label,
    sections: surface.sections.map((section) => ({
      section_id: section.sectionId,
      label: section.label,
      kind: section.kind,
      ...(section.kind === 'collection'
        ? {
          items: (section.items ?? []).map((item) => ({
            item_id: item.itemId,
            label: item.label,
            ...(Array.isArray(item.statuses) ? { statuses: [...item.statuses] } : {}),
            ...(Array.isArray(item.actionRefs) ? { action_refs: [...item.actionRefs] } : {}),
            ...(Array.isArray(item.facts) ? {
              facts: item.facts.map((fact) => ({
                fact_id: fact.factId,
                label: fact.label,
                value: fact.value,
              })),
            } : {}),
          })),
        }
        : {
          facts: (section.facts ?? []).map((fact) => ({
            fact_id: fact.factId,
            label: fact.label,
            value: fact.value,
          })),
        }),
    })),
  };
}

export function buildManifestFromAddon(addon) {
  return {
    addon: {
      addon_id: addon.addonId,
      name: addon.name,
      version: addon.version,
      contracts_version: addon.contractsVersion,
      description: addon.description,
      requirements: [...addon.requirements],
      addon_settings: (addon.addonSettings ?? []).map(normalizeSetting),
      addon_actions: (addon.addonActions ?? []).map(normalizeAction),
      addon_runtime_data_surfaces: (addon.addonRuntimeDataSurfaces ?? []).map(normalizeRuntimeSurface),
      adapters: addon.adapters.map((adapter) => ({
        adapter_id: adapter.adapterId,
        label: adapter.label,
        description: adapter.description,
        runtime_code_state: adapter.runtimeCodeState || 'partial',
        shippable_in_release: adapter.shippableInRelease === true,
        shippable_in_debug: adapter.shippableInDebug === true,
        hidden_in_ui: adapter.hiddenInUi === true,
        notes: adapter.notes || '',
        host_mode: adapter.hostMode,
        supported_platforms: [...adapter.supportedPlatforms],
        required_permissions: [...adapter.requiredPermissions],
        required_host_capabilities: [...adapter.requiredHostCapabilities],
        gating_settings: [...adapter.gatingSettings],
        settings: adapter.settings.map(normalizeSetting),
        implementation: {
          module_path: adapter.bundlePath,
          export_name: adapter.implementation.name,
        },
        query_methods: {
          songsense: Object.keys(adapter.queryMethods.songsense),
        },
      })),
    },
  };
}
