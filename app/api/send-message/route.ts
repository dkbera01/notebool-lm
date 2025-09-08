import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { collections, message } = await request.json();

    if (!collections || collections.length === 0) {
      return NextResponse.json(
        { error: "No collections selected" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const allResults = [];
    for (const collectionName of collections) {
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        { url: process.env.QDRANT_URL, collectionName }
      );

      const vectorRetriever = vectorStore.asRetriever({ k: 3 });
      const relevantSearch = await vectorRetriever.invoke(message);
      allResults.push(...relevantSearch);
    }

    const SYSTEM_PROMPT = `
      You are a helpful assistant. Use the following context to answer the user's question.
      Follow these formatting rules:
      1. Use proper Markdown formatting in your responses
      2. For lists, use proper Markdown list formatting with "- " or "1. "
      3. When referencing content from PDFs, always mention the page number in this format: "(page X)"
      4. Use bold text (**text**) for important terms or headings
      5. Use bullet points for listing items
      6. Use proper paragraph breaks for better readability
      7. Provide Source: end of the generation
      
      Only answer based on the available context do not generate by your own. Your response should be well-structured and easy to read.

      if no Context information found then said "I haven't any information"
      
      Context: ${JSON.stringify(allResults)}
    `;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error("Error in send-message:", error);
    return NextResponse.json(
      { error: "Error processing message" },
      { status: 500 }
    );
  }
}
