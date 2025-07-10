import { commands, ExtensionContext, languages, window as vscWindow } from "vscode";
import { PatchCodeLensProvider } from "./PatchCodeLensProvider";
import { FindData, PatchData } from "./shared";
import { WebpackCodeLensProvider } from "./WebpackCodeLensProvider";
import { sendToSockets, startWebSocketServer, stopWebSocketServer } from "./webSocketServer";

export function activate(context: ExtensionContext) {
    startWebSocketServer();

    context.subscriptions.push(
        languages.registerCodeLensProvider(
            {
                pattern: "**/{plugins,userplugins,plugins/_*}/{*.ts,*.tsx,**/index.ts,**/index.tsx}",
            },
            new PatchCodeLensProvider()
        ),

        languages.registerCodeLensProvider({ language: "typescript" }, WebpackCodeLensProvider),
        languages.registerCodeLensProvider({ language: "typescriptreact" }, WebpackCodeLensProvider),

        commands.registerCommand("extendify-companion.testPatch", async (patch: PatchData) => {
            try {
                await sendToSockets({ type: "testPatch", data: patch });
                vscWindow.showInformationMessage("Patch OK!");
            } catch (err) {
                vscWindow.showErrorMessage("Patch failed: " + String(err));
            }
        }),

        commands.registerCommand("extendify-companion.testFind", async (find: FindData) => {
            try {
                await sendToSockets({ type: "testFind", data: find });
                vscWindow.showInformationMessage("Find OK!");
            } catch (err) {
                vscWindow.showErrorMessage("Find bad: " + String(err));
            }
        })
    );
}

export function deactivate() {
    stopWebSocketServer();
}
