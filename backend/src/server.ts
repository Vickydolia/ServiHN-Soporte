import express from "express";
import cors from "cors";
import "dotenv/config";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

import { database } from "./config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

// ==========================================
// SERVIR ARCHIVOS ESTÁTICOS (FRONTEND)
// ==========================================
const frontendPath = path.join(__dirname, '../../');
app.use(express.static(frontendPath));

// ==========================================
// RUTA RAÍZ - SERVIR INDEX.HTML
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ==========================================
// FUNCIÓN PARA OBTENER FILAS DE LA BD
// ==========================================
function obtenerFilas(resultado: any): any[] {
  if (!resultado) {
    return [];
  }

  if (Array.isArray(resultado.recordset)) {
    return resultado.recordset;
  }

  if (
    Array.isArray(
      resultado.recordsets?.[0],
    )
  ) {
    return resultado.recordsets[0];
  }

  if (Array.isArray(resultado.rows)) {
    return resultado.rows;
  }

  if (Array.isArray(resultado[0])) {
    return resultado[0];
  }

  if (Array.isArray(resultado)) {
    return resultado;
  }

  return [];
}

// ==========================================
// SOLICITUD DE ELIMINACIÓN DE CUENTA
// ==========================================
app.post(
  '/api/solicitudes-eliminacion',
  async (req, res) => {
    try {

      const correo = String(
        req.body?.correo ?? ''
      )
        .trim()
        .toLowerCase();

      const tipoUsuario = String(
        req.body?.tipoUsuario ?? ''
      )
        .trim()
        .toLowerCase();

      const password = String(
        req.body?.password ?? ''
      );

      const motivo = String(
        req.body?.motivo ?? ''
      ).trim();

      // ============================
      // VALIDACIONES BÁSICAS
      // ============================


      if (!correo) {
        return res.status(400).json({
          mensaje: 'El correo es obligatorio',
        });
      }

      if (
        !['cliente', 'empleado'].includes(tipoUsuario)
      ) {
        return res.status(400).json({
          mensaje: 'El tipo de usuario es inválido',
        });
      }

      if (!password) {
        return res.status(400).json({
          mensaje: 'La contraseña es obligatoria',
        });
      }

      // ============================
      // BUSCAR CUENTA
      // ============================

      let usuarioEncontrado: any = null;

      if (tipoUsuario === 'cliente') {
        const [respuestaUsuario]: any =
          await database.execute(
            `
            SELECT TOP 1
              nombre,
              correo,
              password_hash
            FROM clientes
            WHERE correo = ?
            `,
            [correo]
          );

        const filas =
          obtenerFilas(respuestaUsuario);

        if (filas.length > 0) {
          usuarioEncontrado = filas[0];
        }
      }

      if (tipoUsuario === 'empleado') {
        const [respuestaUsuario]: any =
          await database.execute(
            `
            SELECT TOP 1
              nombre,
              correo,
              password_hash
            FROM empleados
            WHERE correo = ?
            `,
            [correo]
          );

        const filas =
          obtenerFilas(respuestaUsuario);

        if (filas.length > 0) {
          usuarioEncontrado = filas[0];
        }
      }

      // ============================
      // VALIDAR QUE EXISTA
      // ============================

      if (!usuarioEncontrado) {
        return res.status(401).json({
          mensaje:
            'Correo, contraseña o tipo de usuario incorrectos',
        });
      }

      // ============================
      // VALIDAR CONTRASEÑA
      // ============================

      const hashGuardado = String(
        usuarioEncontrado.password_hash ?? ''
      ).trim();

      const passwordValida =
        await bcrypt.compare(
          password,
          hashGuardado
        );

      if (!passwordValida) {
        return res.status(401).json({
          mensaje:
            'Correo, contraseña o tipo de usuario incorrectos',
        });
      }

      const nombreVerificado = String(
        usuarioEncontrado.nombre ?? ''
      ).trim();

      // ============================
      // GUARDAR SOLICITUD
      // ============================

      const [resultadoSolicitud]: any =
        await database.execute(
          `
          INSERT INTO solicitudes_eliminacion
          (
            nombre,
            correo,
            tipo_usuario,
            motivo,
            fecha,
            estado
          )

          OUTPUT
            INSERTED.id_solicitudEliminar,
            INSERTED.nombre,
            INSERTED.correo,
            INSERTED.tipo_usuario,
            INSERTED.motivo,
            INSERTED.fecha,
            INSERTED.estado

          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            SYSDATETIME(),
            'Pendiente'
          );
          `,
          [
            nombreVerificado,
            correo,
            tipoUsuario,
            motivo || null,
          ]
        );

        // console.log(
        // 'Solicitud guardada en BD:',
        // nombreVerificado,
        // correo,
        // tipoUsuario
        // );

      const solicitudes =
        obtenerFilas(resultadoSolicitud);

      return res.status(201).json({
        mensaje:
          'Solicitud de eliminación enviada correctamente',
        solicitud:
          solicitudes[0] ?? null,
      });

    } catch (error: any) {
      console.error(
        'Error al registrar solicitud de eliminación:',
        error
      );

      return res.status(500).json({
        mensaje:
          'No se pudo registrar la solicitud de eliminación',
        detalle:
          error?.message ?? String(error),
      });
    }
  }
);


// ==========================================
// RUTA NO ENCONTRADA
// ==========================================
app.use((req, res) => {
  return res.status(404).json({
    mensaje: 'Ruta no encontrada',
    metodo: req.method,
    ruta: req.originalUrl,
  });
});



// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(port, () => {
  console.log(
    `Servidor de soporte ejecutándose en http://localhost:${port}`
  );
});