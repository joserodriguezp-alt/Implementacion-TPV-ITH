// Entry point — importa la configuración de entorno antes que todo
import './src/config/env.js'
import app from './src/app.js'
import { env } from './src/config/env.js'

const PORT = env.PORT || 3000

app.listen(PORT, () => {
  console.log(`✅ Servidor POS corriendo en http://localhost:${PORT}`)
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Salud:   http://localhost:${PORT}/health`)
})
