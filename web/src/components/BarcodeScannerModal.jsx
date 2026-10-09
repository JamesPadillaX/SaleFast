import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { IconClose, IconBarcode, IconCamera } from './Icons'

export default function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [errorMessage, setErrorMessage] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef(null)
  const html5QrcodeRef = useRef(null)

  // Web Audio API beep notification
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.15)
    } catch (e) {
      console.warn('Audio play error', e)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    setErrorMessage('')
    setIsScanning(true)

    const elementId = 'html5-qr-reader'
    const html5Qrcode = new Html5Qrcode(elementId)
    html5QrcodeRef.current = html5Qrcode

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 160 },
      aspectRatio: 1.333333,
    }

    html5Qrcode
      .start(
        { facingMode: 'environment' }, // Rear camera
        config,
        (decodedText) => {
          playBeep()
          onScanSuccess(decodedText)
          stopScanner()
        },
        (error) => {
          // Normal scan frame error, no action needed
        }
      )
      .catch((err) => {
        console.error('Error starting camera', err)
        setErrorMessage('No se pudo acceder a la cámara. Asegúrate de otorgar permisos.')
        setIsScanning(false)
      })

    return () => {
      stopScanner()
    }
  }, [isOpen])

  const stopScanner = () => {
    if (html5QrcodeRef.current) {
      if (html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current
          .stop()
          .then(() => {
            html5QrcodeRef.current?.clear()
          })
          .catch((e) => console.error(e))
      }
    }
    setIsScanning(false)
  }

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-container" style={{ maxWidth: '420px', width: '90%' }}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <IconCamera className="text-primary-600" size={22} />
            <h3 className="modal-title">Escanear Código de Barras</h3>
          </div>
          <button className="modal-close" onClick={handleClose}>
            <IconClose size={20} />
          </button>
        </div>

        <div className="modal-body text-center" style={{ padding: '16px' }}>
          <p className="text-sm text-muted mb-3">
            Apunta la cámara del celular hacia el código de barras del producto.
          </p>

          <div
            id="html5-qr-reader"
            ref={scannerRef}
            style={{
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#000',
              minHeight: '240px',
            }}
          />

          {errorMessage && (
            <div className="alert alert-danger mt-3 text-sm" style={{ padding: '8px 12px' }}>
              {errorMessage}
            </div>
          )}

          <div className="mt-3 text-xs text-muted">
            Soporta códigos EAN-13, EAN-8, UPC, Code-128 y códigos QR.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary w-full" onClick={handleClose}>
            Cancelar / Cerrar Cámara
          </button>
        </div>
      </div>
    </div>
  )
}
