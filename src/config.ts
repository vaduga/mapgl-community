import { config, GrafanaBootConfig } from '@grafana/runtime';
import { PluginState } from '@grafana/data';
// Legacy binding paths
export { config, GrafanaBootConfig as Settings };

// The `enable_alpha` flag is no exposed directly, this is equivolant
export const hasAlphaPanels = Boolean(config.panels?.debug?.state === PluginState.alpha);
