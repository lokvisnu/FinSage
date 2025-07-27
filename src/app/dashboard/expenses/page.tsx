"use client";

import React, { useState, useEffect } from "react";
import { theme, tw } from "@/styles/theme";

type Expense = {
  id: number;
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at?: string;
};

type Category = {
  id: number;
  name: string;
  budget?: number;
  user_id: string;
  created_at: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);

  // Category edit state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryBudget, setEditCategoryBudget] = useState("");

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses");
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load expenses");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !category || !date) return;

    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        // Update existing expense
        const res = await fetch("/api/expenses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            amount: parseFloat(amount),
            category,
            description,
            date,
          }),
        });
        if (!res.ok) throw new Error("Failed to update expense");
        setEditingId(null);
      } else {
        // Add new expense
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parseFloat(amount),
            category,
            description,
            date,
          }),
        });
        if (!res.ok) throw new Error("Failed to add expense");
      }

      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      fetchExpenses();

      // Refresh dashboard data if the function is available
      if (typeof (window as any).refreshDashboard === "function") {
        (window as any).refreshDashboard();
      }
    } catch (e) {
      setError(
        editingId ? "Failed to update expense" : "Failed to add expense"
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setCategoryLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          budget: newCategoryBudget ? parseFloat(newCategoryBudget) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to add category");

      setNewCategoryName("");
      setNewCategoryBudget("");
      setShowAddCategory(false);
      fetchCategories();
    } catch (e) {
      setError("Failed to add category");
      console.error(e);
    } finally {
      setCategoryLoading(false);
    }
  }

  async function handleDeleteExpense(id: number) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete expense");

      fetchExpenses();

      // Refresh dashboard data if the function is available
      if (typeof (window as any).refreshDashboard === "function") {
        (window as any).refreshDashboard();
      }
    } catch (e) {
      setError("Failed to delete expense");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleEditExpense(expense: Expense) {
    setEditingId(expense.id);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description || "");
    setDate(expense.date);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
  }

  async function handleDeleteCategory(id: number) {
    if (
      !confirm(
        "Are you sure you want to delete this category? It cannot be deleted if it has associated expenses."
      )
    )
      return;

    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      fetchCategories();
    } catch (e: any) {
      setError(e.message || "Failed to delete category");
      console.error(e);
    }
  }

  function handleEditCategory(cat: Category) {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryBudget(cat.budget?.toString() || "");
  }

  function handleCancelCategoryEdit() {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategoryBudget("");
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategoryId || !editCategoryName.trim()) return;

    setCategoryLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategoryId,
          name: editCategoryName.trim(),
          budget: editCategoryBudget ? parseFloat(editCategoryBudget) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update category");

      setEditingCategoryId(null);
      setEditCategoryName("");
      setEditCategoryBudget("");
      fetchCategories();
    } catch (e) {
      setError("Failed to update category");
      console.error(e);
    } finally {
      setCategoryLoading(false);
    }
  }

  // Calculate metrics
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Current month expenses
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(
        expense.date || expense.created_at || new Date()
      );
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Today's expenses
  const today = new Date().toDateString();
  const todayExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(
        expense.date || expense.created_at || new Date()
      );
      return expenseDate.toDateString() === today;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Average daily spending this month
  const currentDay = new Date().getDate();
  const avgDailySpending = currentDay > 0 ? monthlyExpenses / currentDay : 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Expenses</h1>
        <p className="text-slate-600">
          Track and manage your daily expenses with smart categorization.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
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
            <p className="text-sm font-medium text-slate-600">This Month</p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{monthlyExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600">Today</p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{todayExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
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
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600">Avg/Day</p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{avgDailySpending.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-sm p-6 text-white">
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
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/80">Total Expenses</p>
            <p className="text-2xl font-bold text-white">
              ₹{totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Expense Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
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
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? "Edit Expense" : "Add Expense"}
                </h2>
              </div>
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
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

            <form onSubmit={handleAddExpense} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Select category</option>
                  {categories.map((cat, index) => (
                    <option
                      key={cat.id || `${cat.name}_${index}`}
                      value={cat.name}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Enter expense description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? editingId
                      ? "Updating..."
                      : "Adding..."
                    : editingId
                    ? "Update Expense"
                    : "Add Expense"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Expense List and Categories */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Recent Expenses
              </h2>
              <div className="flex gap-2">
                <button className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-200 transition-colors">
                  All
                </button>
                <button className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-lg">
                  Recent
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse flex justify-between items-center p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-3 bg-slate-200 rounded w-32"></div>
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-slate-400"
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
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No expenses yet
                  </h3>
                  <p className="text-slate-500">
                    Start tracking your expenses by adding your first entry.
                  </p>
                </div>
              ) : (
                expenses.slice(0, 10).map((expense, index) => (
                  <div
                    key={expense.id || index}
                    className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {expense.category}
                      </p>
                      <p className="text-sm text-slate-600">
                        {expense.description || "No description"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(
                          expense.date || expense.created_at || new Date()
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        ₹{expense.amount.toLocaleString()}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                          title="Edit expense"
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
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Delete expense"
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

          {/* Category Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Categories</h2>
              <button
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-sm bg-purple-100 text-purple-600 hover:bg-purple-200 px-3 py-1 rounded-lg transition-colors"
              >
                {showAddCategory ? "Cancel" : "Add Category"}
              </button>
            </div>

            {showAddCategory && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Budget (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newCategoryBudget}
                        onChange={(e) => setNewCategoryBudget(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={categoryLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {categoryLoading ? "Adding..." : "Add Category"}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <p className="text-slate-500">No categories available</p>
                </div>
              ) : (
                categories.map((cat, index) => {
                  const categoryExpenses = expenses.filter(
                    (exp) => exp.category === cat.name
                  );
                  const spent = categoryExpenses.reduce(
                    (sum, exp) => sum + exp.amount,
                    0
                  );
                  const budget = cat.budget || 0;
                  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                  const _id = cat.id;
                  return (
                    <div
                      key={cat.id || `${cat.name}_${index}`}
                      className="p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span className="font-medium text-slate-900">
                            {cat.name}
                          </span>
                        </div>
                        {budget > 0 && (
                          <span className="text-sm text-slate-500">
                            ₹{spent.toLocaleString()}/₹{budget.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {budget > 0 && (
                        <>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-purple-500"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {percentage.toFixed(0)}% used
                          </div>
                        </>
                      )}
                      {budget === 0 && (
                        <div className="text-sm text-slate-500">
                          Total spent: ₹{spent.toLocaleString()}
                        </div>
                      )}
                      {_id && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className={`bg-gray-700 hover:bg-gray-800 text-white text-sm font-light py-0 px-3 rounded-lg transition-all duration-200`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className=" bg-gray-200 hover:bg-gray-100 text-black font-light text-sm py-0 px-3 rounded-lg transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Edit Category Form */}
            {editingCategoryId !== null && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <form onSubmit={handleUpdateCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter category name"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Budget (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editCategoryBudget}
                        onChange={(e) => setEditCategoryBudget(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={categoryLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {categoryLoading ? "Updating..." : "Update Category"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelCategoryEdit}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
