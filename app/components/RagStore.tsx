'use client'

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

interface Collection {
  name: string;
}

interface CollectionDetails {
  status: string;
  vectors_count: number;
  config: any;
}

interface Point {
  id: string | number;
  payload?: any;
}

export default function RagStore({
  refresh,
  onSelectChange,
  setSourceCount,
}: {
  refresh: boolean;
  onSelectChange: (collections: string[]) => void;
  setSourceCount: (count: number) => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [details, setDetails] = useState<CollectionDetails | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // For modal

  // Fetch collections on load or refresh
  useEffect(() => {
    fetch("/api/qdrant?path=collections")
      .then((res) => res.json())
      .then((data) => {
        if (data.result?.collections) {
          const fetched = data.result.collections;
          setSourceCount(fetched.length);
          setCollections(fetched);

          // Update local state first
          const fetchedNames = fetched.map((c: any) => c.name);
          const newSelection = [...new Set([...selectedCollections, ...fetchedNames])];
          setSelectedCollections(newSelection);

          // Then use a separate effect to notify parent
          if (newSelection.length > 0) {
            onSelectChange(newSelection);
          }
        }
      })
      .catch(console.error);
  }, [refresh, deleteTarget]);

  // Toggle single collection selection
  const toggleSelect = (name: string) => {
    setSelectedCollections((prev) => {
      const updated = prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name];
      onSelectChange(updated);
      return updated;
    });
  };

  // Select/deselect all collections
  const toggleSelectAll = () => {
    setSelectedCollections((prev) => {
      const updated =
        prev.length === collections.length
          ? []
          : collections.map((c) => c.name);
      onSelectChange(updated);
      return updated;
    });
  };

  // Toggle open/close collection details
  const handleToggle = async (name: string) => {
    if (openCollection === name) {
      setOpenCollection(null);
      setDetails(null);
      setPoints([]);
      setSources([]);
      return;
    }

    setOpenCollection(name);
    setLoading(true);
    setDetails(null);
    setPoints([]);
    setSources([]);

    try {
      const metaRes = await fetch(`/api/qdrant?path=collections/${name}`);
      const metaData = await metaRes.json();
      if (metaData.result) setDetails(metaData.result);

      const pointsRes = await fetch(
        `/api/qdrant?path=collections/${name}/points/scroll`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 100, with_payload: true }),
        }
      );
      const pointsData = await pointsRes.json();
      if (pointsData.result?.points) {
        setPoints(pointsData.result.points);
        const uniqueSources = [
          ...new Set(
            pointsData.result.points
              .map((p: Point) => p.payload?.sourceId)
              .filter((id: unknown): id is string => typeof id === 'string')
          ),
        ];
        setSources(uniqueSources);
      }
    } catch (err) {
      console.error("Failed to fetch collection details", err);
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete collection
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/qdrant?path=collections/${deleteTarget}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.name !== deleteTarget));
        setSelectedCollections((prev) => {
          const updated = prev.filter((n) => n !== deleteTarget);
          onSelectChange(updated);
          return updated;
        });
        if (openCollection === deleteTarget) {
          setOpenCollection(null);
          setDetails(null);
          setPoints([]);
          setSources([]);
        }
      } else {
        alert("Failed to delete collection");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Error while deleting collection");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <section className="bg-black/50 rounded-2xl p-4 shadow-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-white">Sources</h2>
        <button
          onClick={toggleSelectAll}
          className="py-1 px-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold text-white text-sm"
        >
          {selectedCollections.length === collections.length
            ? "Deselect All"
            : "Select All"}
        </button>
      </div>

      {/* Collection list */}
      <div
        className="overflow-y-auto scrollbar-custom"
        style={{ maxHeight: "calc(70vh - 100px)" }}
      >
        <ul className="space-y-2">
          <AnimatePresence>
            {collections.map((collection) => (
              <motion.li
                key={collection.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                layout
                className="text-gray-300 transition hover:bg-black/30 rounded-xl p-3 cursor-pointer border border-transparent hover:border-cyan-500"
              >
                <div className="flex justify-between items-center">
                  {/* Custom checkbox */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center mr-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.name)}
                      onChange={() => toggleSelect(collection.name)}
                      className="w-4 h-4 accent-cyan-500 cursor-pointer rounded"
                    />
                  </div>

                  {/* Collection name */}
                  <span
                    className="flex-1 cursor-pointer hover:text-cyan-400"
                    onClick={() => handleToggle(collection.name)}
                  >
                    {collection.name}
                  </span>

                  {/* Trash icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(collection.name);
                    }}
                    className="p-2 rounded-full hover:bg-red-500/30 hover:text-red-400 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Collection details */}
                <AnimatePresence>
                  {openCollection === collection.name && (
                    <motion.div
                      key={collection.name + "-details"}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden mt-3 bg-black/40 p-4 rounded-xl border border-white/10"
                    >
                      {loading && (
                        <p className="text-gray-400">Loading details...</p>
                      )}

                      {!loading && details && (
                        <>
                          {sources.length > 0 && (
                            <>
                              <h3 className="text-lg font-semibold text-cyan-400">
                                Sources
                              </h3>
                              <ul className="list-disc list-inside text-gray-300 mb-4">
                                {sources.map((src) => (
                                  <li key={src}>{src}</li>
                                ))}
                              </ul>
                            </>
                          )}
                          <h3 className="text-lg font-semibold text-cyan-400">
                            Content
                          </h3>
                          {points.length > 0 ? (
                            points.map((point) => (
                              <pre
                                key={point.id}
                                className="bg-black/30 p-2 rounded mt-2 text-xs overflow-x-auto"
                              >
                                {JSON.stringify(point.payload, null, 2)}
                              </pre>
                            ))
                          ) : (
                            <p className="text-gray-400">
                              No sample points found
                            </p>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Delete Collection
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="text-red-400">{deleteTarget}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="py-1 px-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="py-1 px-4 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-white text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
