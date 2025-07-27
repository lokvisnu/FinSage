"use client";

import React, { useState, useEffect } from "react";
import { theme, tw } from "@/styles/theme";

type Liability = {
  id: number;
  name: string;
  amount: number;
  description?: string;
  created_at?: string;
};

// TODO: Replace with real user_id from auth context/session
// const USER_ID = "demo-user-uuid-1234"; // Removed - now using authenticated user

export default function LiabilitiesPage() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function fetchLiabilities() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/liabilities`);
      const data = await res.json();
      setLiabilities(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load liabilities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLiabilities();
  }, []);

  async function handleAddLiability(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !amount) return;
    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        // Update existing liability
        const res = await fetch(`/api/liabilities`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name, amount, description }),
        });
        if (!res.ok) throw new Error("Failed to update liability");
        setEditingId(null);
      } else {
        // Add new liability
        const res = await fetch("/api/liabilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, amount, description }),
        });
        if (!res.ok) throw new Error("Failed to add liability");
      }
      setName("");
      setAmount("");
      setDescription("");
      fetchLiabilities();
    } catch (e) {
      setError(
        editingId ? "Failed to update liability" : "Failed to add liability"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLiability(id: number) {
    if (!confirm("Are you sure you want to delete this liability?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/liabilities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete liability");
      fetchLiabilities();
    } catch (e) {
      setError("Failed to delete liability");
    } finally {
      setLoading(false);
    }
  }

  function handleEditLiability(liability: Liability) {
    setEditingId(liability.id);
    setName(liability.name);
    setAmount(liability.amount.toString());
    setDescription(liability.description || "");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setAmount("");
    setDescription("");
  }

  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + liability.amount,
    0
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Liabilities</h1>
        <p className="text-gray-600">
          Track and manage your debts and financial obligations.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${tw.cardElegant} p-6`}>
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
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Total Debt</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{totalLiabilities.toLocaleString()}
            </p>
          </div>
        </div>

        <div className={`${tw.cardElegant} p-6`}>
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {liabilities.length}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Active Debts</p>
            <p className="text-2xl font-bold text-gray-900">
              {liabilities.length}
            </p>
          </div>
        </div>

        <div className={`${tw.cardElegant} p-6`}>
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
            <p className="text-sm font-medium text-gray-600">Avg Debt Size</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹
              {liabilities.length > 0
                ? Math.round(
                    totalLiabilities / liabilities.length
                  ).toLocaleString()
                : 0}
            </p>
          </div>
        </div>

        <div
          className={`rounded-2xl shadow-lg p-6 text-white ${theme.gradients.dark}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/80">Debt-to-Income</p>
            <p className="text-2xl font-bold text-white">--%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Liability Form */}
        <div className="lg:col-span-1">
          <div className={`${tw.cardElegant} p-6 sticky top-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Liability" : "Add Liability"}
              </h2>
            </div>

            <form className="space-y-4" onSubmit={handleAddLiability}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liability Type
                </label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all">
                  <option>Select type</option>
                  <option>Credit Card</option>
                  <option>Personal Loan</option>
                  <option>Home Loan</option>
                  <option>Car Loan</option>
                  <option>Student Loan</option>
                  <option>Business Loan</option>
                  <option>Others</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., HDFC Credit Card"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outstanding Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Additional details about this liability"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all h-20 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                className={`w-full ${tw.button.primary} py-3 px-4 rounded-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                disabled={loading}
              >
                {loading
                  ? editingId
                    ? "Updating..."
                    : "Adding..."
                  : editingId
                  ? "Update Liability"
                  : "Add Liability"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-medium transition-all"
                >
                  Cancel Edit
                </button>
              )}
            </form>

            {error && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-600">{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* Liabilities List */}
        <div className="lg:col-span-2 space-y-8">
          <div className={`${tw.cardElegant} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Your Liabilities
              </h2>
              <div className="flex gap-2">
                <button className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                  All
                </button>
                <button className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg">
                  High Priority
                </button>
                <button className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                  Recent
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading liabilities...</p>
                </div>
              ) : liabilities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No liabilities added yet
                  </h3>
                  <p className="text-gray-500">
                    Start tracking your debts by adding your first liability.
                  </p>
                </div>
              ) : (
                liabilities.map((liability) => (
                  <div
                    key={liability.id}
                    className="p-6 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {liability.name}
                            </h3>
                            {liability.description && (
                              <p className="text-sm text-gray-600">
                                {liability.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {liability.created_at && (
                          <p className="text-xs text-gray-400">
                            Added:{" "}
                            {new Date(
                              liability.created_at
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          ₹{liability.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          Outstanding
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditLiability(liability)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteLiability(liability.id)}
                            className="text-xs bg-gray-900 hover:bg-gray-800 text-white px-3 py-1 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Debt Management Tips */}
          {liabilities.length > 0 && (
            <div className={`${tw.cardElegant} p-6`}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Debt Management Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-gray-700"
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
                    <span className="font-medium text-gray-900">
                      Prioritize High Interest
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Pay off high-interest debts first to minimize total interest
                    paid.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-gray-700"
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
                    <span className="font-medium text-gray-900">
                      Make Extra Payments
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Pay more than the minimum to reduce principal faster.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">
                      Create a Budget
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Allocate specific amounts for debt payments in your budget.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">
                      Consider Consolidation
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Combine multiple debts into one payment with better terms.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
