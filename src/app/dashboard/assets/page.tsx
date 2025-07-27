"use client";

import React, { useState, useEffect } from "react";
import { tw } from "@/styles/theme";

type Asset = {
  id: number;
  name: string;
  type: string;
  amount: number;
  description?: string;
  created_at?: string;
};

const assetTypes = [
  "Cash",
  "Savings Account",
  "Investment",
  "Real Estate",
  "Stocks",
  "Bonds",
  "Cryptocurrency",
  "Other",
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed to fetch assets");
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load assets");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssets();
  }, []);

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !type || !amount) return;
    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        // Update existing asset
        const res = await fetch("/api/assets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name,
            type,
            amount: parseFloat(amount),
            description,
          }),
        });
        if (!res.ok) throw new Error("Failed to update asset");
        setEditingId(null);
      } else {
        // Add new asset
        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            type,
            amount: parseFloat(amount),
            description,
          }),
        });
        if (!res.ok) throw new Error("Failed to add asset");
      }
      setName("");
      setType("");
      setAmount("");
      setDescription("");
      fetchAssets();
    } catch (e) {
      setError(editingId ? "Failed to update asset" : "Failed to add asset");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAsset(id: number) {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete asset");
      fetchAssets();
    } catch (e) {
      setError("Failed to delete asset");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleEditAsset(asset: Asset) {
    setEditingId(asset.id);
    setName(asset.name);
    setType(asset.type);
    setAmount(asset.amount.toString());
    setDescription(asset.description || "");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setType("");
    setAmount("");
    setDescription("");
  }

  const totalAssets = assets.reduce((sum, asset) => sum + asset.amount, 0);
  const assetsByType = assetTypes
    .map((assetType) => {
      const typeAssets = assets.filter((asset) => asset.type === assetType);
      const total = typeAssets.reduce((sum, asset) => sum + asset.amount, 0);
      return { type: assetType, total, count: typeAssets.length };
    })
    .filter((item) => item.total > 0);

  return (
    <div className={tw.container}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Assets</h1>
        <p className="text-gray-600">
          Track and manage your financial assets and investments.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className={`${tw.cardElegant} hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Total Assets</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{totalAssets.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {assets.length} assets tracked
            </p>
          </div>
        </div>

        <div
          className={`${tw.cardElegant} hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Asset Types</p>
            <p className="text-2xl font-bold text-gray-900">
              {assetsByType.length}
            </p>
            <p className="text-xs text-gray-500">Different categories</p>
          </div>
        </div>

        <div
          className={`${tw.cardElegant} hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Average Asset</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹
              {assets.length > 0
                ? Math.round(totalAssets / assets.length).toLocaleString()
                : "0"}
            </p>
            <p className="text-xs text-gray-500">Per asset value</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Asset Form */}
        <div
          className={`${tw.cardElegant} hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingId ? "Edit Asset" : "Add New Asset"}
            </h2>
            {editingId && (
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleAddAsset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={tw.input}
                placeholder="e.g., Emergency Fund, Apple Stock"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={tw.input}
                required
              >
                <option value="">Select asset type</option>
                {assetTypes.map((assetType) => (
                  <option key={assetType} value={assetType}>
                    {assetType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={tw.input}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={tw.input}
                rows={3}
                placeholder="Additional details about this asset"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`${tw.button.primary} flex-1 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading
                  ? editingId
                    ? "Updating..."
                    : "Adding..."
                  : editingId
                  ? "Update Asset"
                  : "Add Asset"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`${tw.button.secondary} px-6`}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Assets List */}
        <div
          className={`${tw.cardElegant} hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Assets</h2>
            <span className="text-sm text-gray-500">{assets.length} total</span>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {assets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-1-1V4a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="font-medium">No assets added yet</p>
                <p className="text-sm">Start by adding your first asset</p>
              </div>
            ) : (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {asset.name}
                        </h3>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          {asset.type}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{asset.amount.toLocaleString()}
                      </p>
                      {asset.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {asset.description}
                        </p>
                      )}
                      {asset.created_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          Added{" "}
                          {new Date(asset.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAsset(asset)}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                        title="Edit asset"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete asset"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Asset Breakdown by Type */}
      {assetsByType.length > 0 && (
        <div
          className={`${tw.cardElegant} hover:shadow-xl transition-all duration-300 mt-8`}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Asset Breakdown by Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetsByType.map((item, index) => (
              <div key={item.type} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{item.type}</h3>
                  <span className="text-xs text-gray-500">
                    {item.count} asset{item.count !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ₹{item.total.toLocaleString()}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(item.total / totalAssets) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
