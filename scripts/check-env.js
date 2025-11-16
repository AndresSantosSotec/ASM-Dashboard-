/**
 * Script para verificar que las variables de entorno están correctamente cargadas
 * 
 * Uso: node scripts/check-env.js
 */

// Cargar variables de entorno desde .env
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    // Ignorar comentarios y líneas vacías
    if (!line || line.startsWith('#')) return;
    
    const [key, ...values] = line.split('=');
    const value = values.join('=').trim();
    
    if (key && value) {
      process.env[key] = value;
    }
  });
}

console.log('\n🔍 === VERIFICACIÓN DE VARIABLES DE ENTORNO ===\n');

console.log('Variables NEXT_PUBLIC requeridas para Moodle:\n');

const requiredVars = {
  'NEXT_PUBLIC_MOODLE_URL': process.env.NEXT_PUBLIC_MOODLE_URL,
  'NEXT_PUBLIC_MOODLE_TOKEN': process.env.NEXT_PUBLIC_MOODLE_TOKEN,
  'NEXT_PUBLIC_MOODLE_FORMAT': process.env.NEXT_PUBLIC_MOODLE_FORMAT,
};

let allPresent = true;

for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    if (key === 'NEXT_PUBLIC_MOODLE_TOKEN') {
      console.log(`✅ ${key}: ${value.substring(0, 10)}... (${value.length} caracteres)`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: NO DEFINIDA`);
    allPresent = false;
  }
}

console.log('');

if (!allPresent) {
  console.error('⚠️  ADVERTENCIA: Faltan variables de entorno requeridas');
  console.log('\n📝 Asegúrate de que tu archivo .env contiene:');
  console.log('   NEXT_PUBLIC_MOODLE_URL=https://campusamerican.com');
  console.log('   NEXT_PUBLIC_MOODLE_TOKEN=tu_token_aqui');
  console.log('   NEXT_PUBLIC_MOODLE_FORMAT=json');
  console.log('\n🔄 Después de editar .env, reinicia el servidor:');
  console.log('   Ctrl+C (detener)');
  console.log('   npm run dev (reiniciar)');
  console.log('');
  process.exit(1);
}

console.log('✅ Todas las variables están configuradas correctamente\n');
