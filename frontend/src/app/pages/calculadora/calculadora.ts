import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService, ProductInput } from '../../services/product.service';
import { ClientService, Client } from '../../services/client.service';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-calculadora',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './calculadora.html',
  styleUrl: './calculadora.scss'
})
export class CalculadoraComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private clientService = inject(ClientService);
  private router = inject(Router);

  // Expose Math to template
  Math = Math;

  // General state signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showSaveForm = signal(false);

  // Spool CRM Clients signals
  clients = signal<Client[]>([]);
  selectedClientId = signal<string>('');

  // Main Form for configuration & variables
  calcForm = this.fb.nonNullable.group({
    // Global parameters
    costoFilamentoKg: [25000, [Validators.required, Validators.min(0)]],
    costoElectricidadHora: [150, [Validators.required, Validators.min(0)]],
    desgasteMaquinaHora: [100, [Validators.required, Validators.min(0)]],
    margenError: [15, [Validators.required, Validators.min(0)]],
    margenGanancia: [100, [Validators.required, Validators.min(0)]],
    
    // Slicer/Part specific parameters
    pesoGramo: [100, [Validators.required, Validators.min(0)]],
    tiempoHora: [4, [Validators.required, Validators.min(0)]],
    costoPostProcesado: [0, [Validators.required, Validators.min(0)]]
  });

  // Save product details sub-form
  saveForm = this.fb.nonNullable.group({
    productName: ['', [Validators.required]],
    tipo: ['caja' as 'caja' | 'otro', [Validators.required]],
    pieces: ['Tapa, Base, Traba, Centro']
  });

  // A reactive signal source synchronized with the cost form values
  formValue = signal(this.calcForm.getRawValue());

  ngOnInit(): void {
    // 1. Preload global variables from localStorage if saved
    const savedGlobals = localStorage.getItem('calculadora_globales');
    if (savedGlobals) {
      try {
        const parsed = JSON.parse(savedGlobals);
        this.calcForm.patchValue({
          costoFilamentoKg: parsed.costoFilamentoKg ?? 25000,
          costoElectricidadHora: parsed.costoElectricidadHora ?? 150,
          desgasteMaquinaHora: parsed.desgasteMaquinaHora ?? 100,
          margenError: parsed.margenError ?? 15,
          margenGanancia: parsed.margenGanancia ?? 100
        });
      } catch (e) {
        console.error('Error pre-loading calculator variables:', e);
      }
    }

    // Initialize signal source
    this.formValue.set(this.calcForm.getRawValue());

    // 2. React to all form updates
    this.calcForm.valueChanges.subscribe(() => {
      const raw = this.calcForm.getRawValue();
      this.formValue.set(raw);

      // Save global configs into localStorage
      const globals = {
        costoFilamentoKg: raw.costoFilamentoKg,
        costoElectricidadHora: raw.costoElectricidadHora,
        desgasteMaquinaHora: raw.desgasteMaquinaHora,
        margenError: raw.margenError,
        margenGanancia: raw.margenGanancia
      };
      localStorage.setItem('calculadora_globales', JSON.stringify(globals));
    });

    // Load CRM clients
    this.loadClients();
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients.set(data);
      },
      error: (err) => {
        console.error('Failed to load clients for calculator:', err);
      }
    });
  }

  // Reactive calculations using Computed Signals
  costoMaterial = computed(() => {
    const val = this.formValue();
    const peso = val.pesoGramo || 0;
    const costoKg = val.costoFilamentoKg || 0;
    return (peso / 1000) * costoKg;
  });

  costoOperativo = computed(() => {
    const val = this.formValue();
    const tiempo = val.tiempoHora || 0;
    const electrico = val.costoElectricidadHora || 0;
    const desgaste = val.desgasteMaquinaHora || 0;
    return tiempo * (electrico + desgaste);
  });

  costoBase = computed(() => {
    const mat = this.costoMaterial();
    const oper = this.costoOperativo();
    const val = this.formValue();
    const post = val.costoPostProcesado || 0;
    return mat + oper + post;
  });

  costoConError = computed(() => {
    const base = this.costoBase();
    const val = this.formValue();
    const errorPct = val.margenError || 0;
    return base * (1 + (errorPct / 100));
  });

  precioFinal = computed(() => {
    const conError = this.costoConError();
    const val = this.formValue();
    const gananciaPct = val.margenGanancia || 0;
    return conError * (1 + (gananciaPct / 100));
  });

  costoPorFallos = computed(() => {
    return this.costoConError() - this.costoBase();
  });

  gananciaLimpia = computed(() => {
    return this.precioFinal() - this.costoConError();
  });

  // Toggles the saving interface
  toggleSaveForm(): void {
    this.showSaveForm.update(val => !val);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Provide default suggestion name based on slice input
    if (this.showSaveForm()) {
      const weight = this.calcForm.value.pesoGramo || 0;
      const hours = this.calcForm.value.tiempoHora || 0;
      this.saveForm.patchValue({
        productName: `Pieza Impresa ${weight}g (${hours}h)`,
        tipo: 'caja',
        pieces: 'Tapa, Base, Traba, Centro'
      });
    }
  }

  // Reactive change of default pieces depending on selected product type
  onSaveTipoChange(): void {
    const tipo = this.saveForm.get('tipo')?.value;
    const piecesControl = this.saveForm.get('pieces');
    if (tipo === 'caja') {
      piecesControl?.setValue('Tapa, Base, Traba, Centro');
    } else {
      piecesControl?.setValue('');
    }
  }

  // Call the ProductService to write the final item into DB
  guardarComoProducto(): void {
    if (this.saveForm.invalid) {
      this.errorMessage.set('Completa los campos del formulario de guardado.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { productName, tipo, pieces } = this.saveForm.getRawValue();
    const roundedPrice = Math.round(this.precioFinal());
    const roundedCost = Math.round(this.costoConError());

    const defaultPieces = pieces
      ? pieces.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload: ProductInput = {
      name: productName,
      price: roundedPrice,
      cost: roundedCost,
      tipo,
      defaultPieces
    };

    this.productService.createProduct(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('¡Producto guardado exitosamente en el catálogo!');
        this.saveForm.reset({
          productName: '',
          tipo: 'caja',
          pieces: 'Tapa, Base, Traba, Centro'
        });
        this.showSaveForm.set(false);

        // Redirect to catalog page to see the newly added item
        setTimeout(() => {
          this.router.navigate(['/dashboard/catalogo']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'No se pudo guardar el producto. Inténtalo nuevamente.');
      }
    });
  }

  generarPDF(): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Decorative margins and colors
    const startX = 20;
    const endX = 190;
    let yOffset = 25;

    // Header Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 26);
    doc.text('PRESUPUESTO DE IMPRESIÓN 3D', 105, yOffset, { align: 'center' });
    yOffset += 7;

    // Line separator
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(startX, yOffset, endX, yOffset);
    yOffset += 8;

    // Date & Meta
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(102, 102, 102);
    doc.text(`Fecha de Emisión: ${formattedDate}`, startX, yOffset);
    doc.text('Validez: 15 días corridos', endX, yOffset, { align: 'right' });
    yOffset += 15;

    // Client Destination
    const clientId = this.selectedClientId();
    const selectedClient = this.clients().find(c => c.id === clientId);

    if (selectedClient) {
      // Draw background card for client info
      doc.setFillColor(247, 247, 245);
      doc.rect(startX, yOffset, 170, 32, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      doc.text('CLIENTE DESTINATARIO', startX + 5, yOffset + 7);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      doc.text(`Nombre: ${selectedClient.name}`, startX + 5, yOffset + 14);
      doc.text(`Teléfono: ${selectedClient.phone || 'No especificado'}`, startX + 5, yOffset + 21);
      doc.text(`Email: ${selectedClient.email || 'No especificado'}`, startX + 5, yOffset + 28);
      yOffset += 42;
    } else {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(102, 102, 102);
      doc.text('PRESUPUESTO GENERAL ESTIMADO', startX, yOffset);
      yOffset += 15;
    }

    // Details header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text('DETALLE DEL SERVICIO Y ESPECIFICACIONES', startX, yOffset);
    doc.setDrawColor(180, 180, 180);
    doc.line(startX, yOffset + 3, endX, yOffset + 3);
    yOffset += 10;

    // Calculations specs
    const raw = this.formValue();
    const peso = raw.pesoGramo || 0;
    const tiempo = raw.tiempoHora || 0;
    const post = raw.costoPostProcesado || 0;

    const details = [
      { label: 'Peso estimado de la pieza', value: `${peso} gramos` },
      { label: 'Tiempo estimado de impresión', value: `${tiempo} horas` },
      { label: 'Costo base estimado de material (Filamento)', value: `$${Math.round(this.costoMaterial()).toLocaleString('es-AR')}` },
      { label: 'Costo estimado operativo (Electricidad + Desgaste)', value: `$${Math.round(this.costoOperativo()).toLocaleString('es-AR')}` },
      { label: 'Costo de Post-procesado / Adicionales', value: `$${post.toLocaleString('es-AR')}` }
    ];

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.3);

    for (const d of details) {
      doc.text(d.label, startX + 2, yOffset);
      doc.text(d.value, endX - 2, yOffset, { align: 'right' });
      doc.line(startX, yOffset + 3, endX, yOffset + 3);
      yOffset += 8;
    }
    yOffset += 5;

    // Financial calculations & breakdown margins
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    doc.text('Desglose de Tarifas:', startX, yOffset);
    yOffset += 7;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);

    doc.text(`Margen de Error por fallos (+${raw.margenError}%):`, startX + 2, yOffset);
    doc.text(`+$${Math.round(this.costoPorFallos()).toLocaleString('es-AR')}`, endX - 2, yOffset, { align: 'right' });
    yOffset += 6;

    doc.text(`Margen de Ganancia limpia (+${raw.margenGanancia}%):`, startX + 2, yOffset);
    doc.text(`+$${Math.round(this.gananciaLimpia()).toLocaleString('es-AR')}`, endX - 2, yOffset, { align: 'right' });
    yOffset += 10;

    // Pricing box callout
    doc.setFillColor(26, 26, 26);
    doc.rect(startX, yOffset, 170, 22, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL ESTIMADO A ABONAR:', startX + 5, yOffset + 13.5);

    doc.setFontSize(16);
    const finalPriceVal = Math.round(this.precioFinal());
    doc.text(`$${finalPriceVal.toLocaleString('es-AR')} ARS`, endX - 5, yOffset + 14.5, { align: 'right' });
    yOffset += 38;

    // Footer validity
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(128, 128, 128);
    doc.text('Nota: Este presupuesto se genera de forma automatizada en base a las variables de impresión dadas.', 105, yOffset, { align: 'center' });
    doc.text('Los tiempos y pesos reales pueden variar según la calibración de la máquina.', 105, yOffset + 5, { align: 'center' });
    doc.text('Presupuesto válido por 15 días a partir de la fecha de emisión.', 105, yOffset + 10, { align: 'center' });

    // Save
    const clientSuffix = selectedClient ? `_${selectedClient.name.replace(/\s+/g, '_')}` : '';
    doc.save(`Presupuesto_Impresion3D${clientSuffix}.pdf`);
  }
}
