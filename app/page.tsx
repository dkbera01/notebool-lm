"use client";
import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProgressBar from "./components/ProgressBar";
import SourceButtons from "./components/SourceButtons";
import RagStore from "./components/RagStore";
import ChatWindow from "./components/ChatWindow";
import Modal from "./components/Modal";
import { Upload, Loader } from "lucide-react";

// import * as pdfjsLib from "pdfjs-dist";
// import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

import toast, { Toaster } from "react-hot-toast";
// console.log('pdfjsLib.version', pdfWorker);

// pdfjsLib.GlobalWorkerOptions.workerSrc = '/';

export default function Home() {
  const [showFileModal, setShowFileModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [refreshStore, setRefreshStore] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [websiteLinks, setWebsiteLinks] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceCount, setSourceCount] = useState(0);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string }>>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // loaders for different processes
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingWebsite, setLoadingWebsite] = useState(false);

  const sourceCountLimit = 10;

  // Chat message sending
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return toast.error("Please enter a message!");
    if (selectedCollections.length === 0)
      return toast.error("Please select at least one collection!");

    setChatHistory((prev) => [...prev, { sender: "user", text: chatInput }]);
    setChatInput("");
    setLoadingChat(true);

    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collections: selectedCollections,
          message: chatInput,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setChatHistory((prev) => [...prev, { sender: "bot", text: data.text }]);
    } catch (err) {
      toast.error("Error fetching AI response!");
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  // Add source handler
  const handleAddSource = async (type: "file" | "website" | "text") => {
    if (type === "file") {
      if (files.length === 0) return toast.error("Please select a file!");
      setLoadingFile(true);

      try {
        for (const file of files) {
          const fileExt = file.name.split(".").pop()?.toLowerCase();
          if (fileExt !== "pdf" && fileExt !== "csv") {
            toast.error(`Unsupported file type: ${file.name}`);
            continue;
          }

          console.log("Processing file:", file.name, "type:", fileExt);
          const formData = new FormData();

          formData.append("file", file, file.name);
          formData.append("type", "file");
          formData.append("fileType", fileExt);

          const response = await fetch("/api/manage-sources", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              error.error || `Error processing file: ${file.name}`
            );
          }
        }
        toast.success("Files processed successfully!");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error processing files!"
        );
        console.error(err);
      } finally {
        setLoadingFile(false);
      }
    }

    if (type === "text") {
      if (!rawText.trim()) return toast.error("Please enter some text!");
      setLoadingText(true);

      try {
        const formData = new FormData();
        formData.append("type", "text");
        formData.append("rawText", rawText);

        const response = await fetch("/api/manage-sources", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error processing text");
        }

        toast.success("Text processed successfully!");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error processing text!"
        );
        console.error(err);
      } finally {
        setLoadingText(false);
      }
    }

    if (type === "website") {
      if (!websiteLinks.trim())
        return toast.error("Please enter website links!");
      setLoadingWebsite(true);

      try {
        const links = websiteLinks
          .split("\n")
          .map((link) => link.trim())
          .filter((link) => link);

        if (links.length > 10) {
          return toast.error("Please enter up to 10 website links!");
        }

        const formData = new FormData();
        formData.append("type", "website");
        formData.append("links", links.join("\n"));

        const response = await fetch("/api/manage-sources", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error processing website links");
        }

        toast.success("Website(s) processed successfully!");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error processing website links!"
        );
        console.error(err);
      } finally {
        setLoadingWebsite(false);
      }
    }

    setRefreshStore((prev) => !prev);
    setSourceCount((count) => Math.min(10, count + 1));
    setFiles([]);
    setWebsiteLinks("");
    setRawText("");
    setShowFileModal(false);
    setShowWebsiteModal(false);
    setShowTextModal(false);
  };

  const userLogin = () => {
    toast.error("You have reached the maximum number of sources!");
    //TODO: Setup login modal
  };
  return (
    <div className="min-h-screen flex flex-col text-white bg-gradient-to-br from-[#171717] to-[#139bb0]">
      <Toaster position="top-right" reverseOrder={false} />
      <Header />

      <div className="p-4 space-y-4">
        <SourceButtons
          onFile={() =>
            sourceCount < sourceCountLimit
              ? setShowFileModal(true)
              : userLogin()
          }
          onWebsite={() =>
            sourceCount < sourceCountLimit
              ? setShowWebsiteModal(true)
              : userLogin()
          }
          onText={() =>
            sourceCount < sourceCountLimit
              ? setShowTextModal(true)
              : userLogin()
          }
          sourceCountLimit={sourceCountLimit}
          sourceCount={sourceCount}
        />
        <ProgressBar sourceCount={sourceCount} />
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <RagStore
          refresh={refreshStore}
          onSelectChange={(collections) => setSelectedCollections(collections)}
          setSourceCount={setSourceCount}
        />
        <ChatWindow
          chatHistory={chatHistory}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendMessage={handleSendMessage}
          loading={loadingChat}
        />
      </main>

      <Footer />

      {/* File Modal */}
      {showFileModal && (
        <Modal title="Upload File" onClose={() => setShowFileModal(false)}>
          <div className="bg-black/40 rounded-xl p-6 border border-dashed border-white/20 hover:bg-black/50 transition relative flex flex-col items-center justify-center mb-6">
            <input
              type="file"
              multiple
              accept=".pdf,.csv"
              onChange={(e) =>
                setFiles(e.target.files ? Array.from(e.target.files) : [])
              }
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-10 h-10 text-cyan-400 mb-2" />
            <p className="text-gray-300">Click or drag files to upload</p>
            {files.length > 0 && (
              <div className="text-sm text-gray-300 mt-3">
                {files.length} file(s) selected
              </div>
            )}
          </div>
          <button
            onClick={() => handleAddSource("file")}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            disabled={loadingFile}
          >
            {loadingFile && <Loader className="w-5 h-5 animate-spin" />}
            Add Source
          </button>
        </Modal>
      )}

      {/* Website Modal */}
      {showWebsiteModal && (
        <Modal
          title="Add Website Links"
          onClose={() => setShowWebsiteModal(false)}
        >
          <textarea
            placeholder="Paste website links here..."
            value={websiteLinks}
            onChange={(e) => setWebsiteLinks(e.target.value)}
            className="w-full p-3 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 h-48 mb-6"
          />
          <button
            onClick={() => handleAddSource("website")}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            disabled={loadingWebsite}
          >
            {loadingWebsite && <Loader className="w-5 h-5 animate-spin" />}
            Add Source
          </button>
          <p className="mt-2 text-sm text-yellow-300 mb-3 flex items-start gap-2">
            <span className="mt-0.5">ℹ️</span>
            <span>
              You can add <strong>up to 10 website links</strong> at a time.
              <br />
              Make sure each link is on a separate line.
            </span>
          </p>
        </Modal>
      )}

      {/* Text Modal */}
      {showTextModal && (
        <Modal title="Paste Text" onClose={() => setShowTextModal(false)}>
          <textarea
            placeholder="Paste any raw text content here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full p-3 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 h-48 mb-6"
          />
          <button
            onClick={() => handleAddSource("text")}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            disabled={loadingText}
          >
            {loadingText && <Loader className="w-5 h-5 animate-spin" />}
            Add Source
          </button>
        </Modal>
      )}
    </div>
  );
}
