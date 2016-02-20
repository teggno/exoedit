export interface Mapper {
    setDomainWidgetScriptMapping: (path: string, id: string) => void;
    setPortalWidgetScriptMapping: (path: string, dashboardId: string, title: string) => void;
    setLuaDeviceScriptMapping: (path: string, rid: string) => void;
}

export interface ScriptSource {
    getScript: () => Thenable<string>;
    setMapping: (path: string, mappings: Mapper) => void;
    upload: (newScript: string) => Thenable<void>;
    getTitle(): string;
    domain: string;
}