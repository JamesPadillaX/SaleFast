import React, { useRef } from 'react'
import { IconClose } from './Icons'

export default function QRCodeModal({ product, onClose }) {
  const printRef = useRef(null)
  if (!product) return null

  const qrData = encodeURIComponent(
    JSON.stringify({
      id: product.id,
      codigo: product.codigoBarras,
      nombre: product.nombre,
      precio: product.precioVenta,
    })
  )
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}&margin=10`

  function handlePrint() {
    const win = window.open('', '_blank', 'width=450,height=500')
    win.document.write(`
      <html>
        <head>
          <title>Etiqueta QR - ${product.nombre}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            .card { border: 2px dashed #333; padding: 16px; border-radius: 8px; display: inline-block; }
            h2 { margin: 0 0 6px; font-size: 18px; }
            .price { font-size: 22px; font-weight: bold; color: #16a34a; margin: 8px 0; }
            .barcode { font-family: monospace; font-size: 13px; color: #555; }
            img { width: 180px; height: 180px; margin: 10px auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${product.nombre}</h2>
            <div class="barcode">COD: ${product.codigoBarras}</div>
            <img src="${qrUrl}" alt="QR" />
            <div class="price">S/ ${Number(product.precioVenta).toFixed(2)}</div>
            <small>Sale Fast POS</small>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Código QR del Producto</h3>
            <p className="modal-subtitle">Compatible con app móvil nativa y lectores</p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <IconClose size={20} />
          </button>
        </div>

        <div className="modal-body text-center" ref={printRef}>
          <div className="qr-preview-box">
            <img
              src={qrUrl}
              alt={`QR ${product.nombre}`}
              className="qr-image"
              onError={(e) => {
                // Fallback to local SVG generator if offline
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <div className="qr-fallback" style={{ display: 'none', padding: 20 }}>
              <div style={{ fontSize: 40 }}>📱</div>
              <p className="font-mono mt-2">{product.codigoBarras}</p>
            </div>
          </div>

          <div className="qr-product-info">
            <h4 className="font-bold text-lg">{product.nombre}</h4>
            <p className="text-muted font-mono">Código: {product.codigoBarras}</p>
            <div className="price-tag mt-2">
              <span className="price-badge">Precio: S/ {Number(product.precioVenta).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer flex justify-between">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <div className="flex gap-2">
            <a
              href={qrUrl}
              download={`QR_${product.codigoBarras}.png`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              Descargar PNG
            </a>
            <button className="btn btn-primary" onClick={handlePrint}>
              🖨️ Imprimir Etiqueta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
