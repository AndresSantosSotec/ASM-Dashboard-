/**
 * Script de prueba rápida para verificar la conexión con Moodle
 * 
 * Uso: npm run test:moodle
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const [key, ...values] = line.split('=');
    const value = values.join('=').trim();
    
    if (key && value) {
      process.env[key] = value;
    }
  });
}

const MOODLE_BASE_URL = process.env.NEXT_PUBLIC_MOODLE_URL || 'https://campusamerican.com';
const MOODLE_TOKEN = process.env.NEXT_PUBLIC_MOODLE_TOKEN;
const MOODLE_FORMAT = process.env.NEXT_PUBLIC_MOODLE_FORMAT || 'json';

async function testMoodleConnection() {
  console.log('\n🔍 === PRUEBA DE CONEXIÓN A MOODLE ===\n');
  
  console.log('📋 Configuración:');
  console.log('  URL Base:', MOODLE_BASE_URL);
  console.log('  Token:', MOODLE_TOKEN ? `${MOODLE_TOKEN.substring(0, 10)}...` : '❌ NO CONFIGURADO');
  console.log('  Formato:', MOODLE_FORMAT);
  console.log('');

  if (!MOODLE_TOKEN) {
    console.error('❌ ERROR: Token no configurado');
    console.log('   Agrega NEXT_PUBLIC_MOODLE_TOKEN a tu archivo .env');
    process.exit(1);
  }

  // Test 1: Información del sitio
  console.log('📡 Test 1: Obteniendo información del sitio...');
  try {
    const siteInfoUrl = `${MOODLE_BASE_URL}/webservice/rest/server.php`;
    const params = {
      wstoken: MOODLE_TOKEN,
      wsfunction: 'core_webservice_get_site_info',
      moodlewsrestformat: MOODLE_FORMAT,
    };

    const response = await axios.get(siteInfoUrl, { params, timeout: 10000 });

    if (response.data.exception) {
      console.error('❌ Error de Moodle:', response.data.message);
      console.error('   Código:', response.data.errorcode);
      process.exit(1);
    }

    console.log('✅ Conexión exitosa!');
    console.log('   Sitio:', response.data.sitename);
    console.log('   Usuario:', response.data.username);
    console.log('   Versión:', response.data.version);
    console.log('');
  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }

  // Test 2: Obtener cursos (FUNCIÓN EXACTA QUE USA TU APP)
  console.log('📚 Test 2: Obteniendo cursos (core_course_get_courses)...');
  try {
    const coursesUrl = `${MOODLE_BASE_URL}/webservice/rest/server.php`;
    const params = {
      wstoken: MOODLE_TOKEN,
      wsfunction: 'core_course_get_courses',
      moodlewsrestformat: MOODLE_FORMAT,
    };

    console.log('🔗 URL completa:');
    console.log(`   ${coursesUrl}?wstoken=${MOODLE_TOKEN.substring(0, 10)}...&wsfunction=core_course_get_courses`);
    console.log('');

    const response = await axios.get(coursesUrl, { params, timeout: 10000 });

    // Detectar errores de Moodle
    if (response.data.exception) {
      console.error('❌ ERROR DE MOODLE DETECTADO:');
      console.error('   Mensaje:', response.data.message);
      console.error('   Código:', response.data.errorcode);
      console.error('   Excepción:', response.data.exception);
      console.error('');
      console.error('🔍 ESTE ES EL MISMO ERROR QUE VE TU APLICACIÓN');
      console.error('');
      
      // Diagnóstico específico
      if (response.data.errorcode === 'accessexception') {
        console.error('💡 CAUSA: El servicio web NO tiene permisos para ejecutar core_course_get_courses');
        console.error('');
        console.error('✅ SOLUCIÓN:');
        console.error('   1. Ve a Moodle → Administración del sitio → Servidor → Servicios externos');
        console.error('   2. Encuentra el servicio asociado a tu token');
        console.error('   3. Edita → Funciones → Añade: core_course_get_courses');
        console.error('   4. Guarda cambios');
      }
      
      process.exit(1);
    }

    if (response.data.errorcode) {
      console.error('❌ Error:', response.data.message || response.data.errorcode);
      process.exit(1);
    }

    const courses = Array.isArray(response.data) ? response.data : response.data.courses || [];
    
    console.log(`✅ ${courses.length} cursos encontrados`);
    
    if (courses.length > 0) {
      console.log('\n📖 Primeros 5 cursos:');
      courses.slice(0, 5).forEach((course, index) => {
        console.log(`   ${index + 1}. [${course.id}] ${course.fullname}`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error al obtener cursos:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('');
    console.error('🔍 ESTE ES EL MISMO ERROR QUE VE TU APLICACIÓN');
    process.exit(1);
  }

  console.log('✅ === TODAS LAS PRUEBAS PASARON ===\n');
}

testMoodleConnection().catch(error => {
  console.error('\n💥 Error inesperado:', error);
  process.exit(1);
});
