import PdfPrinter from "pdfmake";
import btoa from "btoa";
import fetch from "node-fetch";
import { extname, dirname, join } from "path";
import { promisify } from "util";
import { pipeline } from "stream";
import { fileURLToPath } from "url";
import fs from "fs-extra";

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

const fetchIamgeBuffer = async (image) => {
  let result = await fetch(image, {
    responseType: "arraybuffer",
  });
  return result.buffer();
};

export const getPDFReadableStream = async (data) => {
  let imagePath = {};
  if (data.cover) {
    let imageBufferArray = await fetchIamgeBuffer(data.cover);
    console.log(imageBufferArray);

    const base64String = btoa(
      String.fromCharCode(...new Uint8Array(imageBufferArray))
    );
    console.log(base64String);

    const imageUrlPath = data.cover.split("/");
    const fileName = imageUrlPath[imageUrlPath.length - 1];
    const extension = extname(fileName);
    const base64Pdf = `data:image/${extension};base64,${base64String}`;

    imagePath = { image: base64Pdf, width: 500, margin: [0, 0, 0, 40] };
  }

  const docDefinition = {
    content: [
      imagePath,
      { text: data.id, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.title, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.category, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.content, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.createdAt, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
    ],
    defaultStyle: {
      font: "Helvetica",
    },
  };

  const options = {};

  const pdfReadableStream = printer.createPdfKitDocument(
    docDefinition,
    options
  );
  // pdfReadableStream.pipe(fs.createWriteStream('document.pdf')); // old syntax for piping
  // pipeline(pdfReadableStream, fs.createWriteStream('document.pdf')) // new syntax for piping (we don't want to pipe pdf into file on disk right now)
  pdfReadableStream.end();
  return pdfReadableStream;
};

export const generatePDFAsync = async (data) => {
  try {
    const asyncPipeline = promisify(pipeline); // promisify is a (VERY COOL) utility which transforms a function that uses callbacks (error-first callbacks) into a function that uses Promises (and so Async/Await). Pipeline is a function that works with callbacks to connect 2 or more streams together --> I can promisify a pipeline getting back and asynchronous pipeline

    const fonts = {
      Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    const printer = new PdfPrinter(fonts);

    let imagePath = {};
    if (data.cover) {
      let imageBufferArray = await fetchIamgeBuffer(data.cover);
      console.log(imageBufferArray);

      const base64String = imageBufferArray.toString("base64")
      console.log(base64String);

      const imageUrlPath = data.cover.split("/");
      const fileName = imageUrlPath[imageUrlPath.length - 1];
      const extension = extname(fileName);
      const base64Pdf = `data:image/${extension};base64,${base64String}`;

      imagePath = { image: base64Pdf, width: 500, margin: [0, 0, 0, 40] };
    }
    const docDefinition = {
      content: [
        imagePath,
        { text: data.id, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
        { text: data.title, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
        {
          text: data.category,
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 40],
        },
        {
          text: data.content,
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 40],
        },
        {
          text: data.createdAt,
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 40],
        },
      ],
      defaultStyle: {
        font: "Helvetica",
      },
      // ...
    };

    const options = {
      // ...
    };

    const pdfReadableStream = printer.createPdfKitDocument(
      docDefinition,
      options
    );
    // pdfReadableStream.pipe(fs.createWriteStream('document.pdf')); // old syntax for piping
    // pipeline(pdfReadableStream, fs.createWriteStream('document.pdf')) // new syntax for piping (we don't want to pipe pdf into file on disk right now)
    pdfReadableStream.end();
    const path = join(
      dirname(fileURLToPath(import.meta.url)),
      `${data.id}.pdf`
    );

    console.log({path})
    await asyncPipeline(pdfReadableStream, fs.createWriteStream(path));
    console.log({ path });
    return path;
  } catch (error) {
    console.log(error);

    throw error;
  }
};
