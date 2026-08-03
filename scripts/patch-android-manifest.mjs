// Injeta as permissões e activities do Google Health Connect no AndroidManifest.xml
// gerado pelo Capacitor e ajusta o minSdk do projeto. Rodado no CI depois de
// `npx cap sync android` para que nenhuma etapa posterior restaure a API 24.
import fs from 'node:fs';

// O plugin capacitor-health exige minSdk 26. O template do Capacitor usa 24, o
// que quebra o merge do manifesto no `assembleDebug`.
const MIN_SDK = 26;
const variablesFile = 'android/variables.gradle';
if (!fs.existsSync(variablesFile)) {
  throw new Error('android/variables.gradle não encontrado; a plataforma Android não foi gerada.');
}

let gradle = fs.readFileSync(variablesFile, 'utf8');
if (/minSdkVersion\s*=\s*\d+/.test(gradle)) {
  gradle = gradle.replace(/minSdkVersion\s*=\s*\d+/g, `minSdkVersion = ${MIN_SDK}`);
} else if (/minSdkVersion\s+\d+/.test(gradle)) {
  gradle = gradle.replace(/minSdkVersion\s+\d+/g, `minSdkVersion = ${MIN_SDK}`);
} else if (/ext\s*\{/.test(gradle)) {
  gradle = gradle.replace(/ext\s*\{/, `ext {\n    minSdkVersion = ${MIN_SDK}`);
} else {
  throw new Error('Bloco ext não encontrado em android/variables.gradle.');
}

fs.writeFileSync(variablesFile, gradle);
const verifiedGradle = fs.readFileSync(variablesFile, 'utf8');
if (!new RegExp(`minSdkVersion\\s*(?:=\\s*|\\s+)${MIN_SDK}\\b`).test(verifiedGradle)) {
  throw new Error(`Falha ao configurar minSdkVersion = ${MIN_SDK}.`);
}
console.log(`variables.gradle verificado: minSdkVersion = ${MIN_SDK}`);

// Defesa adicional: o app gerado pelo Capacitor normalmente referencia
// rootProject.ext.minSdkVersion, mas fixamos também o defaultConfig. Assim o
// build não volta à API 24 mesmo se o template ou algum plugin mudar a origem
// dessa variável.
const appGradleFile = 'android/app/build.gradle';
if (!fs.existsSync(appGradleFile)) {
  throw new Error('android/app/build.gradle não encontrado; a plataforma Android não foi gerada.');
}

let appGradle = fs.readFileSync(appGradleFile, 'utf8');
const minSdkDeclaration = /(minSdk(?:Version)?\s+)(?:rootProject\.ext\.minSdkVersion|project\.[\w.]+|\d+)/;
if (minSdkDeclaration.test(appGradle)) {
  appGradle = appGradle.replace(minSdkDeclaration, `$1${MIN_SDK}`);
} else {
  appGradle = appGradle.replace(/defaultConfig\s*\{/, `defaultConfig {\n        minSdkVersion ${MIN_SDK}`);
}
fs.writeFileSync(appGradleFile, appGradle);

const verifiedAppGradle = fs.readFileSync(appGradleFile, 'utf8');
if (!new RegExp(`minSdk(?:Version)?\\s+${MIN_SDK}\\b`).test(verifiedAppGradle)) {
  throw new Error(`Falha ao fixar minSdkVersion ${MIN_SDK} em android/app/build.gradle.`);
}
console.log(`app/build.gradle verificado: minSdkVersion = ${MIN_SDK}`);

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

PERMISSIONS.push('android.permission.health.READ_RESTING_HEART_RATE');

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
