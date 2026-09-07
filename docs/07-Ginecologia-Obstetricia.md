# 07. Módulo Especializado de Ginecología y Obstetricia — Arquitectura y Guía Clínica

Este documento define la arquitectura satelital, los modelos de datos, las fórmulas obstétricas internacionales y los flujos clínicos del **Módulo de Ginecología y Obstetricia** (Fase 6 del Roadmap oficial).

---

## 1. Arquitectura Satelital de Especialidades

El Sistema Clínico SaaS adopta un **Patrón Satelital Desacoplado** para especialidades médicas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   NÚCLEO CLÍNICO UNIVERSAL (Core)                     │
│  Consultorios (Tenants) ── Usuarios/RBAC ── Pacientes ── Citas ── Consultas │
└────────────────────▲──────────────────────────────▲────────────────────┘
                     │                              │
                     │ Foreign Keys (RESTRICT)      │ Foreign Keys (SET NULL)
┌────────────────────┴──────────────────────────────┴────────────────────┐
│              MÓDULO SATÉLITE: GINECOLOGÍA Y OBSTETRICIA                │
│                                                                        │
│   Historia Ginecológica ── Embarazos ── Controles Prenatales ── Ecos   │
└────────────────────────────────────────────────────────────────────────┘
```

### Ventajas de este Enfoque:
1. **Invarianza del Núcleo:** Las tablas core (`pacientes`, `consultas`, `usuarios`) permanecen limpias y universales, aplicables a cualquier rama de la salud o incluso negocios profesionales.
2. **Activación Modular por Tenant:** Una clínica odontológica o un centro de medicina general no cargan las tablas ni los endpoints de ginecología.
3. **Integridad Referencial Blindada:** Todo registro ginecológico y obstétrico hereda de `TenantBaseEntity`, garantizando aislamiento multi-tenant estricto con claves UUID v4 e índices compuestos.

---

## 2. Componentes de la Fase 6

### 2.1 Tarea 26: Historia Ginecológica (`HistoriaGinecologica`)
Expediente ginecológico longitudinal de la paciente:
- **Antecedentes Menstruales:** Edad de menarquía, duración y regularidad del ciclo menstrual (días), presencia de dismenorrea, fecha de última menstruación (FUM).
- **Planificación Familiar:** Método anticonceptivo en uso actual y métodos previos.
- **Antecedentes Sexuales:** Edad de inicio de vida sexual, parejas sexuales (opcional).
- **Fórmula Obstétrica GPCA:**
  - **G (Gestas):** Número total de embarazos.
  - **P (Partos):** Partos vaginales a término o pretérmino.
  - **C (Cesáreas):** Nacimientos por vía abdominal.
  - **A (Abortos):** Pérdidas espontáneas o interrupciones.
  - *Validación lógica:* $G = P + C + A + \text{embarazo activo (si aplica)}$.
- **Tamizajes Preventivos:**
  - Fecha y resultado del último Papanicolaou / citología cervical (PAP).
  - Fecha y resultado de la última mamografía (clasificación BI-RADS 0 a 6).
- **Patologías Ginecológicas:** Registro de miomatosis, endometriosis, SOP, etc.

---

### 2.2 Tareas 27 y 28: Entidad Embarazo y Algoritmos Obstétricos
Representa cada gestación individual de la paciente:
- **Datos Generales:** Gravidez correlativa (#1, #2...), tipo de embarazo (`UNICO`, `GEMELAR_MONOCORIAL`, `GEMELAR_BICORIAL`, `MULTIPLE`).
- **Inmunología Materna:** Grupo sanguíneo, factor Rh y estado de sensibilización (Coombs indirecto para prevención de isoinmunización Rh).
- **Curva de Peso Materno:** Peso pregestacional y talla para clasificación de IMC inicial según criterios OMS/Atalah.
- **Regla de Naegele para Fecha Probable de Parto (FPP):**
  $$\text{FPP} = \text{FUR} + 7 \text{ días} - 3 \text{ meses} + 1 \text{ año}$$
  (Equivalente a $\text{FUR} + 280 \text{ días}$).
- **Cálculo de Edad Gestacional (EG):**
  $$\text{Días de amenorrea} = \text{Fecha actual} - \text{FUR}$$
  $$\text{Semanas} = \lfloor \text{Días} / 7 \rfloor, \quad \text{Días} = \text{Días} \bmod 7$$
  *Ejemplo:* 28 semanas y 4 días (notación obstétrica: $28^{+4}$ o $28.4$ sem).
- **Estados del Embarazo:** `ACTIVO`, `FINALIZADO_PARTO`, `FINALIZADO_CESAREA`, `FINALIZADO_ABORTO`.

---

### 2.3 Tarea 29: Controles Prenatales (`ControlPrenatal`)
Seguimiento periódico y protocolizado de la díada materno-fetal:
- Número de control y edad gestacional al momento de la evaluación.
- Presión arterial sistólica y diastólica (tamizaje precoz de preeclampsia y estados hipertensivos).
- Altura uterina (AU en cm): Medida desde el borde superior de la sínfisis púbica hasta el fondo uterino.
- Frecuencia cardíaca fetal (FCF en lpm, rango normal: 110–160 lpm).
- Movimientos fetales percibidos (`Presentes`, `Disminuidos`, `Ausentes`).
- Presentación fetal (`CEFALICA`, `PODALICA`, `TRANSVERSA`, `NO_EVALUABLE`).
- Grado de edema periférico y proteinuria en tirilla reactiva.
- Verificación de signos de alarma obstétrica (cefalea, escotomas, tinnitus, pérdida de líquido, metrorragia).

---

### 2.4 Tarea 30: Módulo de Ecografías (`EcografiaObstetrica`)
Informes ecográficos diagnósticos estandarizados:
- **Tipos de Ecografía:**
  1. `TRANSVAGINAL_PRECOZ`: Semanas 6–10 (vitalidad embrionaria, LCN, LCF, saco gestacional).
  2. `SCREENING_11_14`: Semanas 11–13.6 (translucencia nucal TN, hueso nasal, ductus venoso, riesgo de aneuploidías).
  3. `MORFOLOGICA_20_24`: Semanas 20–24 (anatomía fetal de órganos diana, placenta, cordón, líquido).
  4. `CRECIMIENTO_TERCER_TRIMESTRE`: Semanas 28–40 (curva de crecimiento y biometría fetal).
  5. `DOPPLER_FETO_PLACENTARIO`: Evaluación hemodinámica de arterias uterinas, umbilical y cerebral media.
  6. `GINECOLOGICA_PELVICA`: Estudio de útero y anejos en pacientes no gestantes.
- **Biometría Fetal Automatizada (Fórmula de Hadlock):**
  - **DBP:** Diámetro Biparietal (mm).
  - **CC:** Circunferencia Cefálica (mm).
  - **CA:** Circunferencia Abdominal (mm).
  - **LF:** Longitud Femoral (mm).
  - **PFE:** Peso Fetal Estimado (gramos) y percentil de crecimiento.
- **Evaluación de Placenta y Líquido Amniótico:** Localización, grado de maduración Grannum (0, I, II, III), e Índice de Líquido Amniótico (ILA) o pozo mayor.

---

## 3. Matriz de Permisos RBAC para Ginecología

- `ginecologia:historia:ver`: Ver antecedentes ginecológicos de la paciente.
- `ginecologia:historia:editar`: Registrar y actualizar la historia ginecológica.
- `ginecologia:embarazos:crear`: Aperturar expedientes de control prenatal/embarazo.
- `ginecologia:embarazos:ver`: Consultar embarazos activos e históricos.
- `ginecologia:controles:crear`: Registrar controles prenatales periódicos.
- `ginecologia:controles:ver`: Ver evolución clínica y curvas de crecimiento.
- `ginecologia:ecografias:crear`: Emitir informes ecográficos obstétricos y ginecológicos.
- `ginecologia:ecografias:ver`: Consultar informes y mediciones biométricas fetales.
