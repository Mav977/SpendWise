import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
// Optional: import * as Updates from 'expo-updates'; to reload the app

export async function importDatabase() {
  const dbName = 'myDatabase.db';
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/octet-stream',
    });

    if (result.canceled) {
      console.log('Import cancelled by user.');
      return;
    }

    const uri = result.assets?.[0]?.uri;

    // Ensure SQLite folder exists
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    // Replace the DB
    await FileSystem.copyAsync({
      from: uri,
      to: dbPath,
    });

    console.log('✅ Import successful. Restart app to apply.');
Alert.alert(
  'Import Successful',
  'Database imported. Restart app to apply',
  [{ text: 'OK' }]
);
  } catch (error) {
    Alert.alert(
  'Failed',
  'Database failed to import.',
  [{ text: 'OK' }]
);
    console.error('❌ Import failed:', error);
  }
}

export async function exportDatabase() {
  const dbName = 'myDatabase.db';
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
  const exportPath = `${FileSystem.documentDirectory}${dbName}`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      console.warn('Database not found in sandbox.');
      return;
    }

    await FileSystem.copyAsync({
      from: dbPath,
      to: exportPath, 
    });

    await Sharing.shareAsync(exportPath, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Export Spendwise Database',
    });

    console.log('✅ Exported successfully.');
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}
