import PdfPrinter from "pdfmake"

export const getPDFReadableStream = (data) => {
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      // italics: "fonts/Roboto-Italic.ttf",
      // bolditalics: "fonts/Roboto-MediumItalic.ttf",
    },
  }

  const printer = new PdfPrinter(fonts)

  const docDefinition = {
    content: [ `${data.title}`
 

  ],
    defaultStyle: {
      font: "Helvetica",
    },
    // ...
  }

  const options = {
    // ...
  }

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition, options)
  // pdfReadableStream.pipe(fs.createWriteStream('document.pdf')); // old syntax for piping
  // pipeline(pdfReadableStream, fs.createWriteStream('document.pdf')) // new syntax for piping (we don't want to pipe pdf into file on disk right now)
  pdfReadableStream.end()
  return pdfReadableStream
}