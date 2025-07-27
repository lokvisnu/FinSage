"use client";

import React, { useState, useEffect } from "react";
import { theme, tw } from "@/styles/theme";

type FinancialData = {
  expenses: any[];
  assets: any[];
  liabilities: any[];
  categories: any[];
};

export default function DashboardPage() {
  const [data, setData] = useState<FinancialData>({
    expenses: [],
    assets: [],
    liabilities: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  // Refresh function to be called from other pages
  const refreshData = () => {
    fetchFinancialData();
  };

  // Make refresh function available globally
  useEffect(() => {
    (window as any).refreshDashboard = refreshData;
    return () => {
      delete (window as any).refreshDashboard;
    };
  }, []);

  async function fetchFinancialData() {
    try {
      const [expensesRes, assetsRes, liabilitiesRes, categoriesRes] =
        await Promise.all([
          fetch("/api/expenses"),
          fetch("/api/assets"),
          fetch("/api/liabilities"),
          fetch("/api/categories"),
        ]);

      const [expenses, assets, liabilities, categories] = await Promise.all([
        expensesRes.json(),
        assetsRes.json(),
        liabilitiesRes.json(),
        categoriesRes.json(),
      ]);

      setData({ expenses, assets, liabilities, categories });
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate dynamic metrics
  const totalAssets = data.assets.reduce(
    (sum, asset) => sum + Number(asset.amount),
    0
  );
  const totalLiabilities = data.liabilities.reduce(
    (sum, liability) => sum + Number(liability.amount),
    0
  );
  const netWorth = totalAssets - totalLiabilities;

  // Expense calculations
  const totalExpenses = data.expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  // Current month expenses
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = data.expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date || expense.created_at);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Today's expenses
  const today = new Date().toDateString();
  const todayExpenses = data.expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date || expense.created_at);
      return expenseDate.toDateString() === today;
    })
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Category breakdown
  const categoryTotals = data.expenses.reduce((acc: any, expense) => {
    const category = expense.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  // Calculate category breakdown for display
  const categoryBreakdown = topCategories.map(([name, amount]) => ({
    name,
    amount: amount as number,
    percentage:
      totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0,
  }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Financial Overview
        </h1>
        <p className="text-gray-600">
          Welcome back! Here's your financial summary at a glance.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Monthly Expenses */}
        <div className={`${tw.card} p-6`}>
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{monthlyExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Assets */}
        <div className={`${tw.card} p-6`}>
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Total Assets</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{totalAssets.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Liabilities */}
        <div className={`${tw.card} p-6`}>
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
            <p className="text-sm font-medium text-gray-600">Total Debt</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{totalLiabilities.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Net Worth */}
        <div
          className={`${theme.gradients.elegantDark} rounded-xl p-6 text-white`}
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/80">Net Worth</p>
            <p className="text-2xl font-bold text-white">
              ₹{netWorth.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`${tw.card} p-6`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Spending
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            ₹{todayExpenses.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-2">Total expenses today</p>
        </div>

        <div className={`${tw.card} p-6`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Total Records
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Expenses:</span>
              <span className="font-semibold">{data.expenses.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assets:</span>
              <span className="font-semibold">{data.assets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Liabilities:</span>
              <span className="font-semibold">{data.liabilities.length}</span>
            </div>
          </div>
        </div>

        <div className={`${tw.card} p-6`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Financial Health
          </h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {netWorth >= 0 ? "✓" : "⚠"}{" "}
              {netWorth >= 0 ? "Positive" : "Negative"}
            </div>
            <p className="text-sm text-gray-600">Net Worth Status</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`${tw.card} p-6`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Top Spending Categories
          </h3>
          <div className="space-y-4">
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No expense data available</p>
                <p className="text-sm text-gray-400 mt-2">
                  Start adding expenses to see category breakdown
                </p>
              </div>
            ) : (
              categoryBreakdown.map((category, index) => (
                <div key={`${category.name}_${index}`} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">
                      {category.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      ₹{category.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {category.percentage.toFixed(1)}% of total expenses
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${tw.card} p-6`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {data.expenses.slice(0, 5).map((expense, index) => (
              <div
                key={`expense_${index}`}
                className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {expense.category || "Uncategorized"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {expense.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(
                      expense.date || expense.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  ₹{Number(expense.amount).toLocaleString()}
                </span>
              </div>
            ))}
            {data.expenses.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent expenses</p>
                <p className="text-sm text-gray-400 mt-2">
                  Start tracking your expenses
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
