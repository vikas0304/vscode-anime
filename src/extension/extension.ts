import * as vscode from 'vscode';
import { ColorThemeKind } from 'vscode';
import { randomName } from '../common/names';
import {
    CHARACTER_DATA,
    getAvailableSeries,
    getCharactersBySeries,
    getDefaultCharacter,
    getRandomCharacter,
} from '../common/characters';
import {
    ALL_SCALES,
    ALL_THEMES,
    AnimeCharacterType,
    AnimeSeries,
    CharacterSize,
    ExtPosition,
    Theme,
    WebviewMessage,
} from '../common/types';

// ─── Storage Keys ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'anime-coder.characters';
const STORAGE_TYPES = STORAGE_KEY + '.types';
const STORAGE_NAMES = STORAGE_KEY + '.names';

// ─── Defaults ──────────────────────────────────────────────────────────────
const DEFAULT_SIZE = CharacterSize.medium;
const DEFAULT_POSITION = ExtPosition.explorer;
const DEFAULT_THEME = Theme.none;
const DEFAULT_CHARACTER = getDefaultCharacter();

// ─── State ─────────────────────────────────────────────────────────────────
let webviewViewProvider: AnimeWebviewViewProvider;
let statusBarItem: vscode.StatusBarItem;

// ─── Configuration Helpers ─────────────────────────────────────────────────

function getConfiguredSize(): CharacterSize {
    let size = vscode.workspace
        .getConfiguration('anime-coder')
        .get<CharacterSize>('characterSize', DEFAULT_SIZE);
    if (ALL_SCALES.indexOf(size) === -1) {
        size = DEFAULT_SIZE;
    }
    return size;
}

function getConfiguredTheme(): Theme {
    let theme = vscode.workspace
        .getConfiguration('anime-coder')
        .get<Theme>('theme', DEFAULT_THEME);
    if (ALL_THEMES.indexOf(theme) === -1) {
        theme = DEFAULT_THEME;
    }
    return theme;
}

function getConfiguredThemeKind(): ColorThemeKind {
    return vscode.window.activeColorTheme.kind;
}

function getConfigurationPosition(): ExtPosition {
    return vscode.workspace
        .getConfiguration('anime-coder')
        .get<ExtPosition>('position', DEFAULT_POSITION);
}

// ─── Character Specification ───────────────────────────────────────────────

class CharacterSpecification {
    type: AnimeCharacterType;
    size: CharacterSize;
    name: string;

    constructor(type: AnimeCharacterType, size: CharacterSize, name?: string) {
        this.type = type;
        this.size = size;
        this.name = name || randomName();
    }

    static collectionFromMemento(
        context: vscode.ExtensionContext,
        size: CharacterSize,
    ): CharacterSpecification[] {
        const types = context.globalState.get<AnimeCharacterType[]>(STORAGE_TYPES, []);
        const names = context.globalState.get<string[]>(STORAGE_NAMES, []);
        const result: CharacterSpecification[] = [];
        for (let i = 0; i < types.length; i++) {
            result.push(new CharacterSpecification(types[i], size, names[i]));
        }
        return result;
    }
}

async function storeCollection(
    context: vscode.ExtensionContext,
    collection: CharacterSpecification[],
): Promise<void> {
    const types = collection.map((c) => c.type);
    const names = collection.map((c) => c.name);
    await context.globalState.update(STORAGE_TYPES, types);
    await context.globalState.update(STORAGE_NAMES, names);
    context.globalState.setKeysForSync([STORAGE_TYPES, STORAGE_NAMES]);
}

// ─── Default Characters from Config ────────────────────────────────────────

interface IDefaultCharacterConfig {
    type: AnimeCharacterType;
    name?: string;
}

function getConfiguredDefaultCharacters(): CharacterSpecification[] {
    const defaults = vscode.workspace
        .getConfiguration('anime-coder')
        .get<IDefaultCharacterConfig[]>('defaultCharacters', []);
    const size = getConfiguredSize();
    const result: CharacterSpecification[] = [];
    for (const config of defaults) {
        if (CHARACTER_DATA[config.type]) {
            result.push(new CharacterSpecification(config.type, size, config.name || randomName()));
        }
    }
    return result;
}

function getSessionCollection(context: vscode.ExtensionContext): CharacterSpecification[] {
    const saved = CharacterSpecification.collectionFromMemento(context, getConfiguredSize());
    if (saved.length > 0) {
        return saved;
    }
    return getConfiguredDefaultCharacters();
}

// ─── Panel Helpers ─────────────────────────────────────────────────────────

interface IAnimePanel {
    spawnCharacter(spec: CharacterSpecification): void;
    removeCharacter(name: string): void;
    removeAll(): void;
    listCharacters(): void;
    rollCall(): void;
    update(): void;
}

function getPanel(): IAnimePanel | undefined {
    if (getConfigurationPosition() === ExtPosition.explorer && webviewViewProvider) {
        return webviewViewProvider;
    } else if (AnimePanel.currentPanel) {
        return AnimePanel.currentPanel;
    }
    return undefined;
}

function getWebview(): vscode.Webview | undefined {
    if (getConfigurationPosition() === ExtPosition.explorer && webviewViewProvider) {
        return webviewViewProvider.getWebview();
    } else if (AnimePanel.currentPanel) {
        return AnimePanel.currentPanel.getWebview();
    }
    return undefined;
}

interface ICharacterInfo {
    type: AnimeCharacterType;
    name: string;
}

function waitForCharacterList(webview: vscode.Webview): Promise<ICharacterInfo[]> {
    return new Promise((resolve) => {
        const disposable = webview.onDidReceiveMessage((message: WebviewMessage) => {
            if (message.command !== 'list-characters') { return; }
            disposable.dispose();
            const list: ICharacterInfo[] = [];
            message.text.split('\n').forEach((line) => {
                if (!line) { return; }
                const parts = line.split(',');
                list.push({
                    type: parts[0] as AnimeCharacterType,
                    name: parts[1],
                });
            });
            resolve(list);
        });
    });
}

async function createPlayground(context: vscode.ExtensionContext): Promise<void> {
    const spec = new CharacterSpecification(DEFAULT_CHARACTER, getConfiguredSize());
    AnimePanel.createOrShow(
        context.extensionUri,
        spec.size,
        getConfiguredTheme(),
        getConfiguredThemeKind(),
    );

    if (AnimePanel.currentPanel) {
        const collection = getSessionCollection(context);
        for (const item of collection) {
            AnimePanel.currentPanel.spawnCharacter(item);
        }
        await storeCollection(context, collection);
    }
}

async function updateExtensionPositionContext(): Promise<void> {
    await vscode.commands.executeCommand(
        'setContext',
        'anime-coder.position',
        getConfigurationPosition(),
    );
}

// ─── Activation ────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
    // === Start Command ===
    context.subscriptions.push(
        vscode.commands.registerCommand('anime-coder.start', async () => {
            if (getConfigurationPosition() === ExtPosition.explorer && webviewViewProvider) {
                await vscode.commands.executeCommand('animeView.focus');
            } else {
                await createPlayground(context);
            }
        }),
    );

    // === Status Bar ===
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'anime-coder.spawn-character';
    statusBarItem.text = '$(heart)';
    statusBarItem.tooltip = 'Spawn Anime Character';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // === Webview View Provider (Explorer Sidebar) ===
    const spec = new CharacterSpecification(DEFAULT_CHARACTER, getConfiguredSize());
    webviewViewProvider = new AnimeWebviewViewProvider(
        context,
        context.extensionUri,
        spec.size,
        getConfiguredTheme(),
        getConfiguredThemeKind(),
    );
    updateExtensionPositionContext().catch(console.error);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            AnimeWebviewViewProvider.viewType,
            webviewViewProvider,
        ),
    );

    // === Spawn Character Command ===
    context.subscriptions.push(
        vscode.commands.registerCommand('anime-coder.spawn-character', async () => {
            const panel = getPanel();
            if (getConfigurationPosition() === ExtPosition.explorer && webviewViewProvider) {
                await vscode.commands.executeCommand('animeView.focus');
            }
            if (panel) {
                // Show series picker first
                const series = getAvailableSeries();
                const seriesItems = series.map((s) => ({
                    label: `$(folder) ${s}`,
                    value: s,
                    description: `${getCharactersBySeries(s).length} characters`,
                }));

                // Also show a flat list of all characters
                const allChars = (Object.entries(CHARACTER_DATA) as [AnimeCharacterType, any][])
                    .map(([type, config]) => ({
                        label: config.name,
                        value: type,
                        description: config.series,
                    }));

                const qp = vscode.window.createQuickPick<vscode.QuickPickItem & { value?: any; isSeries?: boolean }>();
                qp.placeholder = 'Select an anime series or search for a character...';
                qp.matchOnDescription = true;

                const setDefaultItems = () => {
                    qp.items = [
                        { label: 'Anime Series', kind: vscode.QuickPickItemKind.Separator },
                        ...seriesItems.map((s) => ({ ...s, isSeries: true })),
                    ];
                };

                const setSearchResults = (query: string) => {
                    const q = query.toLowerCase().trim();
                    const results = allChars.filter(
                        (c) =>
                            c.label.toLowerCase().includes(q) ||
                            c.description.toLowerCase().includes(q),
                    );
                    qp.items = [
                        { label: 'Anime Series', kind: vscode.QuickPickItemKind.Separator },
                        ...seriesItems.map((s) => ({ ...s, isSeries: true })),
                        { label: 'Search Results', kind: vscode.QuickPickItemKind.Separator },
                        ...results.map((r) => ({ ...r, isSeries: false })),
                    ];
                };

                setDefaultItems();

                const disposables: vscode.Disposable[] = [];

                disposables.push(
                    qp.onDidChangeValue((val) => {
                        if (val && val.trim().length > 0) {
                            setSearchResults(val);
                        } else {
                            setDefaultItems();
                        }
                    }),
                );

                disposables.push(
                    qp.onDidAccept(async () => {
                        const sel = qp.selectedItems[0] as any;
                        if (!sel) { qp.hide(); return; }

                        if (sel.isSeries) {
                            // Show characters in that series
                            const seriesChars = getCharactersBySeries(sel.value as AnimeSeries);
                            const charOptions = seriesChars.map((type) => ({
                                label: CHARACTER_DATA[type].name,
                                value: type,
                                description: `#${CHARACTER_DATA[type].id.toString().padStart(3, '0')}`,
                            }));

                            disposables.forEach((d) => d.dispose());
                            qp.dispose();

                            const picked = await vscode.window.showQuickPick(charOptions, {
                                placeHolder: 'Select a character',
                            });

                            if (picked) {
                                const name = await vscode.window.showInputBox({
                                    placeHolder: 'Leave blank for a random name',
                                    prompt: 'Name your character',
                                    value: randomName(),
                                });
                                if (name === undefined) { return; }

                                const charSpec = new CharacterSpecification(
                                    picked.value as AnimeCharacterType,
                                    getConfiguredSize(),
                                    name,
                                );
                                panel.spawnCharacter(charSpec);
                                const col = CharacterSpecification.collectionFromMemento(context, getConfiguredSize());
                                col.push(charSpec);
                                await storeCollection(context, col);
                            }
                        } else {
                            // Direct character selection
                            const selectedType = sel.value as AnimeCharacterType;
                            disposables.forEach((d) => d.dispose());
                            qp.dispose();

                            const name = await vscode.window.showInputBox({
                                placeHolder: 'Leave blank for a random name',
                                prompt: 'Name your character',
                                value: randomName(),
                            });
                            if (name === undefined) { return; }

                            const charSpec = new CharacterSpecification(
                                selectedType,
                                getConfiguredSize(),
                                name,
                            );
                            panel.spawnCharacter(charSpec);
                            const col = CharacterSpecification.collectionFromMemento(context, getConfiguredSize());
                            col.push(charSpec);
                            await storeCollection(context, col);
                        }
                    }),
                );

                disposables.push(
                    qp.onDidHide(() => {
                        disposables.forEach((d) => d.dispose());
                        qp.dispose();
                    }),
                );

                qp.show();
            } else {
                await createPlayground(context);
                vscode.window.showInformationMessage(
                    'Anime Coder playground created! Use "Spawn Anime Character" to add more.',
                );
            }
        }),
    );

    // === Spawn Random Character Command ===
    context.subscriptions.push(
        vscode.commands.registerCommand('anime-coder.spawn-random', async () => {
            const panel = getPanel();
            if (getConfigurationPosition() === ExtPosition.explorer && webviewViewProvider) {
                await vscode.commands.executeCommand('animeView.focus');
            }
            if (panel) {
                const [randomType, randomConfig] = getRandomCharacter();
                const spec = new CharacterSpecification(randomType, getConfiguredSize());
                panel.spawnCharacter(spec);
                const col = CharacterSpecification.collectionFromMemento(context, getConfiguredSize());
                col.push(spec);
                await storeCollection(context, col);
            } else {
                await createPlayground(context);
            }
        }),
    );

    // === Remove Character Command ===
    context.subscriptions.push(
        vscode.commands.registerCommand('anime-coder.remove-character', async () => {
            const panel = getPanel();
            if (!panel) {
                await createPlayground(context);
                return;
            }
            const webview = getWebview();
            if (!webview) { return; }

            const listPromise = waitForCharacterList(webview);
            panel.listCharacters();
            const charList = await listPromise;

            if (!charList.length) {
                vscode.window.showErrorMessage('There are no anime characters to remove.');
                return;
            }

            const picked = await vscode.window.showQuickPick(
                charList.map((c) => ({
                    label: c.name,
                    description: CHARACTER_DATA[c.type]?.name || c.type,
                    value: c,
                })),
                { placeHolder: 'Select the character to remove' },
            );

            if (picked) {
                panel.removeCharacter(picked.value.name);
                const col = charList
                    .filter((c) => c.name !== picked.value.name)
                    .map((c) => new CharacterSpecification(c.type, getConfiguredSize(), c.name));
                await storeCollection(context, col);
            }
        }),
    );

    // === Remove All Characters Command ===
    context.subscriptions.push(
        vscode.commands.registerCommand('anime-coder.remove-all', async () => {
            const panel = getPanel();
            if (panel) {
                panel.removeAll();
                await storeCollection(context, []);
            } else {
                await createPlayground(context);
            }
        }),
    );

    // === Roll-call Command ===
    context.subscriptions.push(
        vscode.commands.registerCommand('anime-coder.roll-call', async () => {
            const panel = getPanel();
            if (panel) {
                panel.rollCall();
            } else {
                await createPlayground(context);
            }
        }),
    );

    // === Configuration Changes ===
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration('anime-coder.characterSize') ||
                e.affectsConfiguration('anime-coder.theme') ||
                e.affectsConfiguration('workbench.colorTheme')
            ) {
                const panel = getPanel();
                if (panel) {
                    panel.update();
                }
            }
            if (e.affectsConfiguration('anime-coder.position')) {
                updateExtensionPositionContext().catch(console.error);
            }
        }),
    );

    // === Panel Serializer ===
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(AnimePanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
                webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
                AnimePanel.revive(
                    webviewPanel,
                    context.extensionUri,
                    getConfiguredSize(),
                    getConfiguredTheme(),
                    getConfiguredThemeKind(),
                );

                if (AnimePanel.currentPanel) {
                    const saved = CharacterSpecification.collectionFromMemento(context, getConfiguredSize());
                    for (const item of saved) {
                        AnimePanel.currentPanel.spawnCharacter(item);
                    }
                }
            },
        });
    }
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

// ─── Webview Options ───────────────────────────────────────────────────────

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions & vscode.WebviewPanelOptions {
    return {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
    };
}

// ─── Nonce Generator ───────────────────────────────────────────────────────

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// ─── Base Webview Container ────────────────────────────────────────────────

class AnimeWebviewContainer implements IAnimePanel {
    protected _extensionUri: vscode.Uri;
    protected _disposables: vscode.Disposable[] = [];
    protected _size: CharacterSize;
    protected _theme: Theme;
    protected _themeKind: ColorThemeKind;

    constructor(
        extensionUri: vscode.Uri,
        size: CharacterSize,
        theme: Theme,
        themeKind: ColorThemeKind,
    ) {
        this._extensionUri = extensionUri;
        this._size = size;
        this._theme = theme;
        this._themeKind = themeKind;
    }

    public spawnCharacter(spec: CharacterSpecification): void {
        void this.getWebview().postMessage({
            command: 'spawn-character',
            type: spec.type,
            name: spec.name,
        });
        void this.getWebview().postMessage({
            command: 'set-size',
            size: spec.size,
        });
    }

    public removeCharacter(name: string): void {
        void this.getWebview().postMessage({
            command: 'remove-character',
            name,
        });
    }

    public removeAll(): void {
        void this.getWebview().postMessage({ command: 'remove-all' });
    }

    public listCharacters(): void {
        void this.getWebview().postMessage({ command: 'list-characters' });
    }

    public rollCall(): void {
        void this.getWebview().postMessage({ command: 'roll-call' });
    }

    public update(): void {
        // Override in subclasses
    }

    protected getWebview(): vscode.Webview {
        throw new Error('Not implemented');
    }

    protected _update(): void {
        const webview = this.getWebview();
        webview.html = this._getHtmlForWebview(webview);
    }

    protected _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main-bundle.js'),
        );
        const stylesResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'),
        );
        const stylesMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'anime.css'),
        );
        const baseMediaUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media'),
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${stylesResetUri}" rel="stylesheet" nonce="${nonce}">
    <link href="${stylesMainUri}" rel="stylesheet" nonce="${nonce}">
    <title>Anime Coder</title>
</head>
<body>
    <div id="animeContainer"></div>
    <div id="foreground"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
    <script nonce="${nonce}">
        animeApp.animePanelApp(
            "${baseMediaUri}",
            "${this._theme}",
            ${this._themeKind},
            "${this._size}",
            "naruto"
        );
    </script>
</body>
</html>`;
    }
}

// ─── Panel View (Editor Tab) ───────────────────────────────────────────────

class AnimePanel extends AnimeWebviewContainer {
    public static currentPanel: AnimePanel | undefined;
    public static readonly viewType = 'animeCoding';

    private readonly _panel: vscode.WebviewPanel;

    public static createOrShow(
        extensionUri: vscode.Uri,
        size: CharacterSize,
        theme: Theme,
        themeKind: ColorThemeKind,
    ): void {
        if (AnimePanel.currentPanel) {
            AnimePanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            AnimePanel.viewType,
            'Anime Coder',
            vscode.ViewColumn.Two,
            getWebviewOptions(extensionUri),
        );

        AnimePanel.currentPanel = new AnimePanel(panel, extensionUri, size, theme, themeKind);
    }

    public static revive(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        size: CharacterSize,
        theme: Theme,
        themeKind: ColorThemeKind,
    ): void {
        AnimePanel.currentPanel = new AnimePanel(panel, extensionUri, size, theme, themeKind);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        size: CharacterSize,
        theme: Theme,
        themeKind: ColorThemeKind,
    ) {
        super(extensionUri, size, theme, themeKind);
        this._panel = panel;
        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.onDidChangeViewState(() => this.update(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            (message: WebviewMessage) => {
                if (message.command === 'alert') {
                    vscode.window.showErrorMessage(message.text);
                } else if (message.command === 'info') {
                    vscode.window.showInformationMessage(message.text);
                }
            },
            null,
            this._disposables,
        );
    }

    public dispose(): void {
        AnimePanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) { x.dispose(); }
        }
    }

    public update(): void {
        if (this._panel.visible) {
            this._update();
        }
    }

    public getWebview(): vscode.Webview {
        return this._panel.webview;
    }
}

// ─── Webview View Provider (Explorer Sidebar) ──────────────────────────────

class AnimeWebviewViewProvider extends AnimeWebviewContainer {
    public static readonly viewType = 'animeView';

    private _webviewView?: vscode.WebviewView;
    private _context: vscode.ExtensionContext;

    constructor(
        context: vscode.ExtensionContext,
        extensionUri: vscode.Uri,
        size: CharacterSize,
        theme: Theme,
        themeKind: ColorThemeKind,
    ) {
        super(extensionUri, size, theme, themeKind);
        this._context = context;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this._webviewView = webviewView;

        webviewView.webview.options = getWebviewOptions(this._extensionUri);
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            (message: WebviewMessage) => {
                if (message.command === 'alert') {
                    vscode.window.showErrorMessage(message.text);
                } else if (message.command === 'info') {
                    vscode.window.showInformationMessage(message.text);
                }
            },
            null,
            this._disposables,
        );

        // Spawn saved characters when the view is ready
        setTimeout(() => {
            const collection = getSessionCollection(this._context);
            for (const item of collection) {
                this.spawnCharacter(item);
            }
        }, 500);
    }

    public update(): void {
        if (this._webviewView) {
            this._webviewView.webview.html = this._getHtmlForWebview(this._webviewView.webview);
        }
    }

    public getWebview(): vscode.Webview {
        if (this._webviewView) {
            return this._webviewView.webview;
        }
        throw new Error('Webview view not initialized');
    }
}
