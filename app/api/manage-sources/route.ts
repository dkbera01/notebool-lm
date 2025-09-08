"use server";
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import PDFParser from "pdf2json";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";


export async function POST(request: Request) {
  try {
    console.log("Content-Type:", request.headers.get("content-type"));
    const formData = await request.formData();
    const type = formData.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    if (type === "file") {
      const file = formData.get("file") as File | null;
      const fileType = formData.get("fileType") as string | null;

      if (!file || !fileType) {
        return NextResponse.json(
          { error: "Missing file information" },
          { status: 400 }
        );
      }

      const fileName = file.name;

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
        separators: ["\n\n", "\n", ".", "!", "?", " ", ""],
      });
      console.warn("fileType", fileType);

      if (fileType === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const dataBuffer = Buffer.from(arrayBuffer);
        const pdfParser = new PDFParser();

        const pdfData: any = await new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (err) => reject(err.parserError));
          pdfParser.on("pdfParser_dataReady", (pdfData) => resolve(pdfData));
          pdfParser.parseBuffer(dataBuffer);
        });

        const pages: string[] = [];

        // Extract text from each page
        pdfData?.Pages?.forEach((page: any) => {
          const pageText = page.Texts.map((t: any) =>
            t.R.map((r: any) => decodeURIComponent(r.T)).join(" ")
          ).join(" ");
          pages.push(pageText);
        });
        const documents: Document[] = [];

        for (let i = 0; i < pages.length; i++) {
          const pageContent = pages[i];
          const pageDocs = await splitter.splitDocuments([
            new Document({
              pageContent,
              metadata: { fileName: file.name, pageNumber: i + 1 },
            }),
          ]);
          documents.push(...pageDocs);
        }

        await QdrantVectorStore.fromDocuments(documents, embeddings, {
          url: process.env.QDRANT_URL,
          collectionName: fileName,
        });
      }

      if (fileType === "csv") {
        const bytes = await file.arrayBuffer();
        const text = Buffer.from(new Uint8Array(bytes)).toString("utf-8");
        const docs = await splitter.splitDocuments([
          new Document({
            pageContent: text,
            metadata: { fileName },
          }),
        ]);

        await QdrantVectorStore.fromDocuments(docs, embeddings, {
          url: process.env.QDRANT_URL,
          collectionName: fileName,
        });
      }
    }

    if (type === "text") {
      const rawText = formData.get("rawText") as string;

      if (!rawText) {
        return NextResponse.json(
          { error: "Missing text content" },
          { status: 400 }
        );
      }

      const title = rawText.slice(0, 30).replace(/\s+/g, "_");
      await QdrantVectorStore.fromDocuments(
        [new Document({ pageContent: rawText, metadata: { title } })],
        embeddings,
        {
          url: process.env.QDRANT_URL,
          collectionName: `${title}_${Date.now()}`,
        }
      );
    }

    if (type === "website") {
      const linksText = formData.get("links") as string;

      if (!linksText) {
        return NextResponse.json(
          { error: "Invalid website links" },
          { status: 400 }
        );
      }

      const links = linksText
        .split("\n")
        .map((link) => link.trim())
        .filter(Boolean);
      for (const link of links) {
  
        const loader = new CheerioWebBaseLoader(link);

        const scrapedData = await loader.load();

        const docs = scrapedData.map(
          (item: any) => new Document(item)
        );

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        const splitDocs = await splitter.splitDocuments(docs);
        const collectionName = link
          .replace(/https?:\/\//, "")
          .replace(/[^a-zA-Z0-9]/g, "_");

        await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
          url: process.env.QDRANT_URL,
          collectionName,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in manage-sources:", error);
    return NextResponse.json(
      { error: "Error processing source" },
      { status: 500 }
    );
  }
}
