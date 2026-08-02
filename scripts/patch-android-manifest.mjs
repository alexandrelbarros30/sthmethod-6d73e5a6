// Injeta as permissões e activities do Google Health Connect no AndroidManifest.xml
// gerado pelo Capacitor e ajusta o minSdk do projeto. Rodado no CI logo após
// `npx cap add android`.
import fs from 'node:fs';

// O plugin capacitor-health exige minSdk 26. O template do Capacitor usa 24, o
// que quebra o merge do manifesto no `assembleDebug`.
const MIN_SDK = 26;
const variablesFile = 'android/variables.gradle';
if (fs.existsSync(variablesFile)) {
  let gradle = fs.readFileSync(variablesFile, 'utf8');
  if (/minSdkVersion\s*=\s*\d+/.test(gradle)) {
    gradle = gradle.replace(/minSdkVersion\s*=\s*\d+/g, `minSdkVersion = ${MIN_SDK}`);
  } else {
    gradle = gradle.replace(/ext\s*\{/, `ext {\n    minSdkVersion = ${MIN_SDK}`);
  }
  fs.writeFileSync(variablesFile, gradle);
  console.log(`variables.gradle: minSdkVersion = ${MIN_SDK}`);
} else {
  console.log('variables.gradle não encontrado — pulando ajuste de minSdk.');
}

const file = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(file)) {
  console.log('AndroidManifest.xml não encontrado — pulando patch do Health Connect.');
  process.exit(0);
}

let xml = fs.readFileSync(file, 'utf8');

const PERMISSIONS = [
  'android.permission.CAMERA',
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_TOTAL_CALORIES_BURNED',
  'android.permission.health.READ_DISTANCE',
  'android.permission.health.READ_EXERCISE',
  'android.permission.health.READ_HEART_RATE',
  'android.permission.health.READ_SLEEP',
  'android.permission.health.READ_WEIGHT',
];

const QUERIES = `    <queries>
        <package android:name="com.google.android.apps.healthdata" />
    </queries>
`;

const RATIONALE = `        <activity
            android:name="com.fit_up.health.capacitor.PermissionsRationaleActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
            </intent-filter>
        </activity>
        <activity-alias
            android:name="ViewPermissionUsageActivity"
            android:exported="true"
            android:targetActivity="com.fit_up.health.capacitor.PermissionsRationaleActivity"
            android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
            </intent-filter>
        </activity-alias>
`;

if (!xml.includes('com.google.android.apps.healthdata')) {
  xml = xml.replace('</manifest>', `${QUERIES}</manifest>`);
}

const missing = PERMISSIONS.filter((p) => !xml.includes(p))
  .map((p) => `    <uses-permission android:name="${p}" />`)
  .join('\n');
if (missing) xml = xml.replace('</manifest>', `${missing}\n</manifest>`);

if (!xml.includes('PermissionsRationaleActivity')) {
  xml = xml.replace('</application>', `${RATIONALE}    </application>`);
}

fs.writeFileSync(file, xml);
console.log('AndroidManifest.xml atualizado com Health Connect.');
