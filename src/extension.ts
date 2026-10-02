import * as vscode from 'vscode';
import { ConverterService } from './services/converterService';

export function activate(context: vscode.ExtensionContext) {
  const converter = new ConverterService();

  // Command 1: Paste C# as Dart (Reads clipboard -> converts C# to Dart -> pastes at cursor)
  const pasteAsDartCommand = vscode.commands.registerCommand(
    'csharpToDart.pasteAsDart',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found to paste Dart code.');
        return;
      }

      // Read C# text from clipboard
      const clipboardText = await vscode.env.clipboard.readText();
      if (!clipboardText || !clipboardText.trim()) {
        vscode.window.showWarningMessage('Clipboard is empty. Copy a C# model first.');
        return;
      }

      // Convert C# to Dart
      const result = converter.convert(clipboardText);

      if (!result.success || !result.dartCode) {
        vscode.window.showErrorMessage(
          result.errorMessage || 'Could not convert clipboard content. Ensure it contains a valid C# class.'
        );
        return;
      }

      // Insert/replace at cursor position
      await editor.edit(editBuilder => {
        if (!editor.selection.isEmpty) {
          editBuilder.replace(editor.selection, result.dartCode!);
        } else {
          editBuilder.insert(editor.selection.active, result.dartCode!);
        }
      });

      // Show brief status bar notification
      vscode.window.setStatusBarMessage(
        `C# model '${result.className}' converted and pasted as Dart.`,
        4000
      );
    }
  );

  // Command 2: Convert Selection: C# to Dart (Converts currently selected C# code in editor to Dart)
  const convertSelectionCommand = vscode.commands.registerCommand(
    'csharpToDart.convertSelection',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found.');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText || !selectedText.trim()) {
        vscode.window.showWarningMessage('Please select C# code in the editor to convert.');
        return;
      }

      const result = converter.convert(selectedText);

      if (!result.success || !result.dartCode) {
        vscode.window.showErrorMessage(
          result.errorMessage || 'Could not convert selected C# code.'
        );
        return;
      }

      await editor.edit(editBuilder => {
        editBuilder.replace(selection, result.dartCode!);
      });

      vscode.window.setStatusBarMessage(
        `C# model '${result.className}' converted to Dart.`,
        4000
      );
    }
  );

  context.subscriptions.push(pasteAsDartCommand, convertSelectionCommand);
}

export function deactivate() {}
