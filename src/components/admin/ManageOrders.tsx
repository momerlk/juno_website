import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Ban,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  RefreshCw,
  Search,
  ShoppingCart,
  Plus,
  Copy,
  Trash2,
  X,
} from "lucide-react";
import { AdminCommerce, AdminPortal } from "../../api/adminApi";
import { uploadFile } from "../../api/shared";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Lightbox } from "@astryxdesign/core/Lightbox";

type OrderView =
  | "all"
  | "open"
  | "pending"
  | "confirmed"
  | "packed"
  | "delivery"
  | "exceptions"
  | "closed"
  | "carts";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "handed_to_rider",
  "at_warehouse",
  "out_for_delivery",
  "delivery_attempted",
  "delivered",
  "cancelled",
  "returned",
] as const;

const PAGE_SIZE = 30;

const DEX_COLUMNS = [
  "Order number",
  "Sender address",
  "Recipient's name",
  "Recipient phone number",
  "Province",
  "District",
  "Wards",
  "Specific address",
  "Product's name",
  "Unit price",
  "Quantity",
  "Weight",
  "Length",
  "Width",
  "Height",
  "COD",
  "COD amount collected on behalf",
  "Fail delivery storage",
  "Delivery note",
] as const;

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of ["orders", "rows", "items", "data", "carts"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
};

const money = (value?: number) =>
  `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const dateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const dateOnly = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PK");
};

const orderTotal = (order: any) =>
  order.total ??
  order.total_amount ??
  order.order_total ??
  order.grand_total ??
  0;

const orderStatus = (order: any) =>
  String(order.status || order.rollup_status || "pending").toLowerCase();

const statusClass = (status: string) => {
  if (["delivered"].includes(status))
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (["cancelled", "returned"].includes(status))
    return "border-red-500/30 bg-red-500/10 text-red-300";
  if (["delivery_attempted"].includes(status))
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (
    ["packed", "handed_to_rider", "at_warehouse", "out_for_delivery"].includes(
      status,
    )
  )
    return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
};

const viewMatches = (order: any, view: OrderView) => {
  const status = orderStatus(order);
  if (view === "all") return true;
  if (view === "open")
    return !["delivered", "cancelled", "returned"].includes(status);
  if (view === "delivery")
    return ["handed_to_rider", "at_warehouse", "out_for_delivery"].includes(
      status,
    );
  if (view === "exceptions")
    return ["delivery_attempted", "cancelled", "returned"].includes(status);
  if (view === "closed")
    return ["delivered", "cancelled", "returned"].includes(status);
  return status === view;
};

const getOrderId = (order: any) => String(order.id || order.order_id || "");

const ManageOrders: React.FC = () => {
  const [view, setView] = useState<OrderView>("open");
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryBookings, setDeliveryBookings] = useState<
    Record<string, any | null>
  >({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<Record<string, any>>({});
  const [expandedPackingPhotos, setExpandedPackingPhotos] = useState<Record<string, string>>({});
  const [expandedOrderLoadingId, setExpandedOrderLoadingId] = useState<string | null>(null);
  const [previewPackingPhoto, setPreviewPackingPhoto] = useState<{ src: string; alt: string } | null>(null);
  const [carts, setCarts] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [customerDraft, setCustomerDraft] = useState<Record<string, string>>(
    {},
  );
  const [addressReview, setAddressReview] = useState<any | null>(null);
  const [dexRows, setDexRows] = useState<Record<string, unknown>[]>([]);
  const [dexDeliveryNote, setDexDeliveryNote] = useState("");
  const [dexPanelOpen, setDexPanelOpen] = useState(false);
  const [dexPaymentOpen, setDexPaymentOpen] = useState(false);
  const [dexStatementFile, setDexStatementFile] = useState<File | null>(null);
  const [dexStatementObjectName, setDexStatementObjectName] = useState("");
  const [dexPaymentResult, setDexPaymentResult] = useState<any | null>(null);
  const [dexStatements, setDexStatements] = useState<any[]>([]);
  const [selectedDexStatement, setSelectedDexStatement] = useState<any | null>(
    null,
  );
  const [brandStatementsOpen, setBrandStatementsOpen] = useState(false);
  const [brandStatements, setBrandStatements] = useState<any[]>([]);
  const [selectedBrandStatement, setSelectedBrandStatement] = useState<
    any | null
  >(null);
  const [statementProofFile, setStatementProofFile] = useState<File | null>(
    null,
  );
  const [statementProofUrl, setStatementProofUrl] = useState("");
  const [statementBankReference, setStatementBankReference] = useState("");
  const [statementPaymentDate, setStatementPaymentDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [bulkStatus, setBulkStatus] =
    useState<(typeof ORDER_STATUSES)[number]>("confirmed");
  const [cancelReason, setCancelReason] = useState("Ops cancellation");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dmDraftOpen, setDMDraftOpen] = useState(false);
  const [dmQuizLink, setDMQuizLink] = useState("");
  const [dmDraft, setDMDraft] = useState({
    product_id: "",
    quantity: "1",
    payment_method: "cod",
    full_name: "",
    phone_number: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    province: "",
    postal_code: "",
    country: "Pakistan",
  });
  const selectedBankDetails =
    selectedBrandStatement?.bank_details ||
    selectedBrandStatement?.seller_bank ||
    selectedBrandStatement?.bank_snapshot;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, cartsRes] = await Promise.all([
        AdminPortal.listOrders(),
        AdminPortal.listCarts(),
      ]);

      if (!ordersRes.ok)
        throw new Error(
          (ordersRes.body as any)?.message || "Failed to load orders",
        );
      if (cartsRes.ok) setCarts(asArray(cartsRes.body));

      setOrders(
        asArray(ordersRes.body).sort(
          (a, b) =>
            Date.parse(b.created_at || "") - Date.parse(a.created_at || ""),
        ),
      );
      setDeliveryBookings({});
      setSelectedIds([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected order loading error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [view, query]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!viewMatches(order, view)) return false;
      if (!q) return true;
      const searchable = [
        order.id,
        order.order_id,
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.customer_email,
        order.seller_name,
        order.seller_id,
        order.shipping_address?.city,
        orderStatus(order),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [orders, query, view]);

  const filteredCarts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return carts;
    return carts.filter((cart) =>
      JSON.stringify(cart).toLowerCase().includes(q),
    );
  }, [carts, query]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pageRows = filteredOrders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const visibleIds = pageRows.map(getOrderId).filter(Boolean);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    let cancelled = false;
    const missingIds = pageRows
      .map(getOrderId)
      .filter((id) => id && !(id in deliveryBookings));
    if (!missingIds.length) return;
    void Promise.all(
      missingIds.map(async (id) => {
        const response = await AdminPortal.getOrder(id);
        return [
          id,
          response.ok ? (response.body as any)?.delivery_booking || null : null,
        ] as const;
      }),
    ).then((bookings) => {
      if (!cancelled)
        setDeliveryBookings((current) => ({
          ...current,
          ...Object.fromEntries(bookings),
        }));
    });
    return () => {
      cancelled = true;
    };
  }, [deliveryBookings, pageRows]);

  const toggleOrderDetails = async (order: any) => {
    const id = getOrderId(order);
    if (!id) return;
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(id);
    if (expandedOrderDetails[id]) return;

    setExpandedOrderLoadingId(id);
    try {
      const response = await AdminPortal.getOrder(id);
      if (!response.ok || !response.body) throw new Error((response.body as any)?.message || 'Could not load order details');
      const detail = response.body as any;
      setExpandedOrderDetails((current) => ({ ...current, [id]: detail }));
      const evidence = detail.packing_evidence;
      if (evidence) {
        const objects = [...(evidence.item_photos || []).map((photo: any) => photo.url), evidence.packed_parcel_photo_url].filter(Boolean);
        const photos = await Promise.all(objects.map(async (objectName: string) => {
          try {
            return [`${id}:${objectName}`, await AdminCommerce.getPackingPhoto(id, objectName)] as const;
          } catch {
            return null;
          }
        }));
        setExpandedPackingPhotos((current) => ({ ...current, ...Object.fromEntries(photos.filter((photo): photo is readonly [string, string] => Boolean(photo))) }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load order details');
    } finally {
      setExpandedOrderLoadingId((current) => current === id ? null : current);
    }
  };

  const metrics = useMemo(() => {
    const open = orders.filter((o) => viewMatches(o, "open"));
    const exceptions = orders.filter((o) => viewMatches(o, "exceptions"));
    return {
      open: open.length,
      exceptions: exceptions.length,
      gmv: orders.reduce(
        (sum, order) => sum + Number(orderTotal(order) || 0),
        0,
      ),
      carts: carts.length,
    };
  }, [carts.length, orders]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected)
        return prev.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const applyBulkStatus = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.bulkUpdateOrders({
        updates: selectedIds.map((order_id) => ({
          order_id,
          status: bulkStatus,
        })),
      });
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Failed to update selected orders",
        );
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update selected orders",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelSelected = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.bulkCancelOrders({
        order_ids: selectedIds,
        reason: cancelReason || "Cancelled by admin",
      });
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Failed to cancel selected orders",
        );
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel selected orders",
      );
    } finally {
      setSaving(false);
    }
  };

  const getDexBookingDetails = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const deliveryNote = dexDeliveryNote.trim() || undefined;
      const res =
        selectedIds.length === 1
          ? await AdminPortal.getDexBookingData(selectedIds[0], deliveryNote)
          : await AdminPortal.getBulkDexBookingData(selectedIds, deliveryNote);
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not get DEX booking details",
        );
      const payload = res.body as any;
      const results = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload?.rows) &&
              payload.rows.every((row: any) => Array.isArray(row?.rows))
            ? payload.rows
            : [payload];
      setDexRows(
        results.flatMap((result) =>
          Array.isArray(result?.rows) ? result.rows : [],
        ),
      );
      setDexPanelOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not get DEX booking details",
      );
    } finally {
      setSaving(false);
    }
  };

  const copyDexRows = async () => {
    if (dexRows.length === 0) return;
    const text = dexRows
      .map((row) =>
        DEX_COLUMNS.map((column) => String(row[column] ?? "")).join("\t"),
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Could not copy DEX rows. Select and copy them manually.");
    }
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError("Could not copy that value.");
    }
  };

  const openDexPayment = () => {
    setDexStatementFile(null);
    setDexStatementObjectName("");
    setDexPaymentResult(null);
    setSelectedDexStatement(null);
    setDexPaymentOpen(true);
    void loadDexStatements();
  };

  const uploadDexStatement = async () => {
    if (!dexStatementFile) return;
    if (!dexStatementFile.name.toLowerCase().endsWith(".xlsx")) {
      setError("Choose a Net-Off .xlsx statement.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setDexStatementObjectName((await uploadFile(dexStatementFile)).object);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload statement",
      );
    } finally {
      setSaving(false);
    }
  };

  const importDexStatement = async () => {
    if (!dexStatementObjectName) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.importDexStatement(dexStatementObjectName);
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "DEX statement could not be imported",
        );
      setDexPaymentResult(res.body);
      await load();
      await loadDexStatements();
      await loadBrandStatements();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DEX statement could not be imported",
      );
    } finally {
      setSaving(false);
    }
  };

  const loadDexStatements = async () => {
    try {
      const res = await AdminPortal.listDexStatements();
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not load DEX imports",
        );
      const body = res.body as any;
      setDexStatements(
        Array.isArray(body) ? body : body.statements || body.items || [],
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load DEX imports",
      );
    }
  };

  const selectDexStatement = async (statementId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.getDexStatement(statementId);
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not load DEX import",
        );
      setSelectedDexStatement(res.body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load DEX import",
      );
    } finally {
      setSaving(false);
    }
  };

  const loadBrandStatements = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.listBrandStatements();
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not load brand statements",
        );
      const body = res.body as any;
      setBrandStatements(Array.isArray(body) ? body : body.statements || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load brand statements",
      );
    } finally {
      setSaving(false);
    }
  };

  const openBrandStatements = () => {
    setSelectedBrandStatement(null);
    setBrandStatementsOpen(true);
    void loadBrandStatements();
  };

  const selectBrandStatement = async (statementId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.getBrandStatement(statementId);
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not load brand statement",
        );
      setSelectedBrandStatement(res.body);
      setStatementProofFile(null);
      setStatementProofUrl("");
      setStatementBankReference("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load brand statement",
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadStatementProof = async () => {
    if (!statementProofFile) return;
    setSaving(true);
    setError(null);
    try {
      setStatementProofUrl((await uploadFile(statementProofFile)).url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload payment proof",
      );
    } finally {
      setSaving(false);
    }
  };

  const payBrandStatement = async () => {
    if (
      !selectedBrandStatement?.id ||
      !statementProofUrl ||
      !statementBankReference.trim() ||
      !statementPaymentDate
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.payBrandStatement(
        selectedBrandStatement.id,
        {
          payment_proof_url: statementProofUrl,
          bank_reference: statementBankReference.trim(),
          payment_date: statementPaymentDate,
        },
      );
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not mark statement paid",
        );
      setSelectedBrandStatement(res.body);
      await loadBrandStatements();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not mark statement paid",
      );
    } finally {
      setSaving(false);
    }
  };

  const printBrandStatement = async (kind: "statement" | "invoice") => {
    if (!selectedBrandStatement?.id) return;
    const res = await AdminPortal.getBrandStatementDocument(
      selectedBrandStatement.id,
      kind,
    );
    if (!res.ok) {
      setError(
        (res.body as any)?.message || "Could not load printable document",
      );
      return;
    }
    const popup = window.open("", "_blank");
    if (!popup) {
      setError("Allow pop-ups to print this document.");
      return;
    }
    popup.document.write(res.body.html);
    popup.document.close();
    popup.print();
  };

  const openCustomerEditor = (order: any) => {
    setSelectedOrder(order);
    setAddressReview(order.address_review || null);
    setCustomerDraft({
      name: order.customer_name || "",
      email: order.customer_email || "",
      phone: order.customer_phone || "",
      address_line1:
        order.shipping_address?.address_line1 ||
        order.shipping_address?.address ||
        "",
      address_line2: order.shipping_address?.address_line2 || "",
      city: order.shipping_address?.city || "",
    });
  };

  const saveCustomer = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.updateOrderCustomer(
        getOrderId(selectedOrder),
        {
          ...customerDraft,
          ...(addressReview?.formatted_address
            ? {
                formatted_address: addressReview.formatted_address,
                missing_fields: addressReview.missing_fields || [],
                customer_message: addressReview.customer_message || "",
              }
            : {}),
        },
      );
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Failed to update customer details",
        );
      setAddressReview((res.body as any)?.address_review || addressReview);
      setSelectedOrder(null);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update customer details",
      );
    } finally {
      setSaving(false);
    }
  };

  const createAddressPrompt = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.createAddressPrompt(
        getOrderId(selectedOrder),
      );
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not create address prompt",
        );
      setAddressReview(res.body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create address prompt",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmAddress = async () => {
    if (
      !selectedOrder ||
      addressReview?.format_status !== "ready" ||
      addressReview?.missing_fields?.length
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.updateOrderCustomer(
        getOrderId(selectedOrder),
        { customer_confirmed: true },
      );
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not confirm address",
        );
      setAddressReview(
        (res.body as any)?.address_review || {
          ...addressReview,
          customer_confirmed: true,
        },
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not confirm address",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelSingleOrder = async (order: any) => {
    const orderId = getOrderId(order);
    if (!orderId) return;
    const reason = window.prompt(
      `Cancel order ${order.order_number || orderId} with reason:`,
      cancelReason || "Cancelled by admin",
    );
    if (!reason) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.cancelOrder(orderId, reason);
      if (!res.ok)
        throw new Error((res.body as any)?.message || "Failed to cancel order");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setSaving(false);
    }
  };

  const createDMDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.createDMOrderDraft({
        product_id: dmDraft.product_id,
        quantity: Number(dmDraft.quantity),
        payment_method: dmDraft.payment_method,
        customer: {
          full_name: dmDraft.full_name,
          phone_number: dmDraft.phone_number,
          email: dmDraft.email || undefined,
          address_line1: dmDraft.address_line1,
          address_line2: dmDraft.address_line2 || undefined,
          city: dmDraft.city,
          province: dmDraft.province || undefined,
          postal_code: dmDraft.postal_code || undefined,
          country: dmDraft.country || "Pakistan",
        },
      });
      if (!res.ok)
        throw new Error(
          (res.body as any)?.message || "Could not create DM order draft",
        );
      setDMQuizLink(`${window.location.origin}${res.body.quiz_path}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create DM order draft",
      );
    } finally {
      setSaving(false);
    }
  };

  const views: Array<{ id: OrderView; label: string; count?: number }> = [
    { id: "open", label: "Open", count: metrics.open },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "packed", label: "Packed" },
    { id: "delivery", label: "In delivery" },
    { id: "exceptions", label: "Exceptions", count: metrics.exceptions },
    { id: "closed", label: "Closed" },
    { id: "all", label: "All" },
    { id: "carts", label: "Carts", count: metrics.carts },
  ];

  return (
    <div className="space-y-4">
      <Card padding={0}>
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-white">Orders</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Admin order desk for status batches, single-order cancellation,
              carts, and customer repair.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              label="DM order"
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setDMQuizLink("");
                setDMDraftOpen(true);
              }}
            />
            <Button
              label="Statements"
              variant="secondary"
              size="sm"
              onClick={() => openBrandStatements()}
            />
            <Button
              label="Refresh"
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => void load()}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 text-xs md:grid-cols-4">
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Open orders</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {metrics.open}
            </p>
          </div>
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Exceptions</p>
            <p className="mt-1 text-lg font-semibold text-amber-300">
              {metrics.exceptions}
            </p>
          </div>
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Total GMV in view</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {money(metrics.gmv)}
            </p>
          </div>
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Active carts</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {metrics.carts}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-white/10 px-3 py-2">
          {views.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === tab.id ? "bg-white text-black" : "text-neutral-300 hover:bg-white/10"}`}
            >
              {tab.label}
              {typeof tab.count === "number" ? ` ${tab.count}` : ""}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-b border-white/10 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-lg">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              size={16}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, phone, seller, city"
              className="w-full rounded-md border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary/60"
            />
          </div>

          {view !== "carts" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-400">
                {selectedIds.length} selected
              </span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as any)}
                className="rounded-md border border-white/10 bg-black/30 px-2 py-2 text-xs text-white"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                disabled={saving || selectedIds.length === 0}
                onClick={() => void applyBulkStatus()}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
              >
                <CheckSquare size={14} /> Apply status
              </button>
              <button
                disabled={saving || selectedIds.length === 0}
                onClick={() => void getDexBookingDetails()}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
              >
                <Copy size={14} /> Get DEX booking details
              </button>
              <button
                disabled={saving}
                onClick={openDexPayment}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
              >
                <CheckSquare size={14} /> Import DEX Net-Off
              </button>
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-44 rounded-md border border-white/10 bg-black/30 px-2 py-2 text-xs text-white"
              />
              <button
                disabled={saving || selectedIds.length === 0}
                onClick={() => void cancelSelected()}
                className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
              >
                <Trash2 size={14} /> Cancel
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {view === "carts" ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="p-3">Cart</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarts.map((cart, index) => (
                  <tr
                    key={cart.id || index}
                    className="border-b border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="p-3 font-mono text-xs text-white">
                      {cart.id || cart.guest_cart_id || "-"}
                    </td>
                    <td className="p-3 text-neutral-300">
                      {cart.user_id || cart.guest_cart_id || "Guest"}
                    </td>
                    <td className="p-3 text-neutral-300">
                      {cart.items?.length || cart.item_count || 0}
                    </td>
                    <td className="p-3 text-white">
                      {money(cart.total_value || cart.total)}
                    </td>
                    <td className="p-3 text-neutral-400">
                      {dateTime(cart.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="w-10 p-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisible}
                      className="accent-[#f43f5e]"
                    />
                  </th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Juno status</th>
                  <th className="p-3">DEX shipping</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="w-24 p-3">City</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-10 text-center text-neutral-400"
                    >
                      Loading orders...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-10 text-center text-neutral-500"
                    >
                      No orders match this view.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((order) => {
                    const id = getOrderId(order);
                    const status = orderStatus(order);
                    const booking =
                      order.delivery_booking ?? deliveryBookings[id];
                    const dexStatus = booking?.status
                      ? String(booking.status).toLowerCase()
                      : "";
                    const isExpanded = expandedOrderId === id;
                    const detail = expandedOrderDetails[id] || order;
                    const evidence = detail.packing_evidence;
                    const detailBooking = detail.delivery_booking ?? booking;
                    return (
                      <React.Fragment key={id}>
                      <tr className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(id)}
                            onChange={() => toggleSelected(id)}
                            className="accent-[#f43f5e]"
                          />
                        </td>
                        <td className="p-3">
                          <p className="font-mono text-xs text-white">
                            {order.order_number || id}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-white">
                            {order.customer_name || "Guest customer"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {order.customer_phone ||
                              order.customer_email ||
                              "-"}
                          </p>
                        </td>
                        <td className="p-3 text-neutral-300">
                          {order.seller_name || order.seller_id || "-"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(status)}`}
                          >
                            {status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-3">
                          {booking === undefined ? (
                            <span className="text-xs text-neutral-500">
                              Loading…
                            </span>
                          ) : dexStatus ? (
                            <span
                              className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(dexStatus)}`}
                            >
                              {dexStatus.replace(/_/g, " ")}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-500">
                              Not booked
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium text-white">
                          {money(orderTotal(order))}
                        </td>
                        <td className="w-24 max-w-24 truncate p-3 text-neutral-300">
                          {order.shipping_address?.city || order.city || "-"}
                        </td>
                        <td className="p-3 text-neutral-400">
                          {dateOnly(order.created_at)}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Link
                              to={`/admin/orders/${id}`}
                              className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
                              title="View order"
                            >
                              <Eye size={14} />
                            </Link>
                            <button
                              onClick={() => void toggleOrderDetails(order)}
                              className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
                              title="Toggle order details"
                            >
                              <ChevronDown size={14} className={isExpanded ? "rotate-180 transition-transform" : "transition-transform"} />
                            </button>
                            <button
                              onClick={() => openCustomerEditor(order)}
                              className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
                              title="Edit customer"
                            >
                              <Edit3 size={14} />
                            </button>
                            {!["cancelled", "delivered", "returned"].includes(
                              status,
                            ) ? (
                              <button
                                onClick={() => void cancelSingleOrder(order)}
                                className="rounded-md border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10"
                                title="Cancel order"
                              >
                                <Ban size={14} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-white/5 bg-black/20">
                          <td colSpan={10} className="p-4">
                            {expandedOrderLoadingId === id ? <p className="text-sm text-neutral-400">Loading order details…</p> : (
                              <div className="grid gap-4 xl:grid-cols-4">
                                <section className="rounded-lg border border-white/10 bg-black/30 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Customer shipping</p>
                                  <p className="mt-3 text-sm font-medium text-white">{detail.customer_name || detail.shipping_address?.name || detail.shipping_address?.full_name || 'Guest customer'}</p>
                                  <p className="mt-1 text-xs text-neutral-300">{detail.customer_phone || detail.shipping_address?.phone_number || '-'}</p>
                                  <p className="mt-3 text-xs text-neutral-300">{[detail.shipping_address?.address_line1, detail.shipping_address?.address_line2, detail.shipping_address?.city, detail.shipping_address?.province, detail.shipping_address?.postal_code, detail.shipping_address?.country].filter(Boolean).join(', ') || 'Address unavailable'}</p>
                                </section>
                                <section className="rounded-lg border border-white/10 bg-black/30 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">DEX tracking</p>
                                  {detailBooking ? <div className="mt-3 space-y-1 text-xs text-neutral-300"><p>Tracking: <span className="text-white">{detailBooking.tracking_number || detailBooking.consignment_number || '-'}</span></p><p>Status: <span className="text-white">{String(detailBooking.status || 'Booked').replace(/_/g, ' ')}</span></p>{detailBooking.tracking_url ? <a href={detailBooking.tracking_url} target="_blank" rel="noreferrer" className="text-primary underline">Open DEX tracking</a> : null}</div> : <p className="mt-3 text-xs text-neutral-500">No DEX booking yet.</p>}
                                </section>
                                <section className="rounded-lg border border-white/10 bg-black/30 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Order items</p>
                                  <div className="mt-3 space-y-2">
                                    {(detail.order_items || []).length ? detail.order_items.map((item: any, index: number) => <p key={item.id || index} className="text-xs text-neutral-300"><span className="font-medium text-white">{item.product_name || item.product_id || 'Product'}</span>{item.variant_label || item.variant_id ? ` · ${item.variant_label || item.variant_id}` : ''} · Qty {item.quantity || 0}</p>) : <p className="text-xs text-neutral-500">No order items available.</p>}
                                  </div>
                                </section>
                                <section className="rounded-lg border border-white/10 bg-black/30 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Packing evidence</p>
                                  {evidence ? <div className="mt-3 grid grid-cols-2 gap-2">{[...(evidence.item_photos || []).map((photo: any) => ({ label: 'Item', object: photo.url })), { label: 'Parcel', object: evidence.packed_parcel_photo_url }].map((photo: any, index: number) => expandedPackingPhotos[`${id}:${photo.object}`] ? <button key={`${photo.object}-${index}`} type="button" onClick={() => setPreviewPackingPhoto({ src: expandedPackingPhotos[`${id}:${photo.object}`], alt: `${photo.label} packing evidence` })} className="rounded-md focus:outline-none focus:ring-2 focus:ring-primary"><img src={expandedPackingPhotos[`${id}:${photo.object}`]} alt={`${photo.label} packing evidence`} className="h-24 w-full rounded-md object-cover transition-transform hover:scale-[1.03]" /></button> : <p key={`${photo.object}-${index}`} className="rounded-md border border-white/10 p-2 text-[11px] text-neutral-500">Loading {photo.label.toLowerCase()} photo…</p>)}</div> : <p className="mt-3 text-xs text-neutral-500">Seller has not submitted evidence.</p>}
                                </section>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {view !== "carts" && (
          <div className="flex items-center justify-between border-t border-white/10 p-3 text-xs text-neutral-400">
            <span>
              {filteredOrders.length} orders • page {page} of {pageCount}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-white/10 p-2 hover:bg-white/10 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="rounded-md border border-white/10 p-2 hover:bg-white/10 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {previewPackingPhoto && <Lightbox isOpen onOpenChange={(isOpen) => !isOpen && setPreviewPackingPhoto(null)} media={previewPackingPhoto} hasZoom />}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            className="flex-1"
            onClick={() => setSelectedOrder(null)}
            aria-label="Close drawer"
          />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#111] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Customer repair
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {selectedOrder.order_number || getOrderId(selectedOrder)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3">
              {[
                ["name", "Name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["address_line1", "Address line 1"],
                ["address_line2", "Address line 2"],
                ["city", "City"],
              ].map(([key, label]) => (
                <label key={key} className="text-xs text-neutral-400">
                  {label}
                  <input
                    value={customerDraft[key] || ""}
                    onChange={(e) =>
                      setCustomerDraft((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white">
                    Address review
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Copy the prompt into ChatGPT, then paste its reviewed result
                    here. Juno never sends customer data from this page to AI.
                  </p>
                </div>
                <button
                  disabled={saving}
                  onClick={() => void createAddressPrompt()}
                  className="rounded-md border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Create ChatGPT prompt
                </button>
              </div>
              {addressReview && (
                <div className="mt-4 space-y-3 rounded-md border border-white/10 bg-black/20 p-3">
                  {addressReview.formatter_prompt && (
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
                        <span>Prompt</span>
                        <button
                          onClick={() =>
                            void navigator.clipboard.writeText(
                              addressReview.formatter_prompt,
                            )
                          }
                          className="inline-flex items-center gap-1 text-primary"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={addressReview.formatter_prompt}
                        className="h-24 w-full rounded-md border border-white/10 bg-black/30 p-2 font-mono text-xs text-white/75"
                      />
                    </div>
                  )}
                  <label className="block text-xs text-neutral-400">
                    Formatted address
                    <textarea
                      value={addressReview.formatted_address || ""}
                      onChange={(e) =>
                        setAddressReview((current: any) => ({
                          ...current,
                          formatted_address: e.target.value,
                          format_status: "ready",
                        }))
                      }
                      className="mt-1 h-16 w-full rounded-md border border-white/10 bg-black/30 p-2 text-sm text-white"
                    />
                  </label>
                  <label className="block text-xs text-neutral-400">
                    Missing fields (comma separated)
                    <input
                      value={(addressReview.missing_fields || []).join(", ")}
                      onChange={(e) =>
                        setAddressReview((current: any) => ({
                          ...current,
                          missing_fields: e.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="block text-xs text-neutral-400">
                    Customer message
                    <textarea
                      value={addressReview.customer_message || ""}
                      onChange={(e) =>
                        setAddressReview((current: any) => ({
                          ...current,
                          customer_message: e.target.value,
                          format_status: "ready",
                        }))
                      }
                      className="mt-1 h-16 w-full rounded-md border border-white/10 bg-black/30 p-2 text-sm text-white"
                    />
                  </label>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-neutral-400">
                      {addressReview.customer_confirmed
                        ? "Customer confirmed"
                        : addressReview.missing_fields?.length
                          ? "Customer information still needed"
                          : "Ready for customer confirmation"}
                    </span>
                    <button
                      disabled={
                        saving ||
                        addressReview.customer_confirmed ||
                        addressReview.format_status !== "ready" ||
                        Boolean(addressReview.missing_fields?.length)
                      }
                      onClick={() => void confirmAddress()}
                      className="rounded-md bg-white px-3 py-2 font-semibold text-black disabled:opacity-40"
                    >
                      Customer confirmed address
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Close
              </button>
              <button
                disabled={saving}
                onClick={() => void saveCustomer()}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Save changes
              </button>
            </div>
          </aside>
        </div>
      )}

      {dexPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            className="flex-1"
            onClick={() => setDexPanelOpen(false)}
            aria-label="Close DEX booking details"
          />
          <aside className="h-full w-full max-w-4xl overflow-y-auto border-l border-white/10 bg-[#111] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Manual DEX booking
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Copy booking details
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Paste these rows into the official DEX workbook. No workbook
                  is generated here.
                </p>
              </div>
              <button
                onClick={() => setDexPanelOpen(false)}
                className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 flex gap-2">
              <input
                value={dexDeliveryNote}
                onChange={(event) => setDexDeliveryNote(event.target.value)}
                placeholder="Delivery note (optional)"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
              <button
                disabled={saving}
                onClick={() => void getDexBookingDetails()}
                className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Refresh rows
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Leave blank to use the delivery note returned by DEX.
            </p>
            {dexRows.length > 0 ? (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-neutral-300">
                    {dexRows.length} DEX row{dexRows.length === 1 ? "" : "s"}
                  </p>
                  <button
                    onClick={() => void copyDexRows()}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"
                  >
                    <Copy size={13} /> Copy rows
                  </button>
                </div>
                <div className="overflow-x-auto rounded-md border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/30 text-neutral-400">
                      <tr>
                        {DEX_COLUMNS.map((column) => (
                          <th key={column} className="whitespace-nowrap p-3">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dexRows.map((row, index) => (
                        <tr key={index} className="border-t border-white/10">
                          {DEX_COLUMNS.map((column) => (
                            <td
                              key={column}
                              className="whitespace-nowrap p-3 text-white/80"
                            >
                              {String(row[column] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-neutral-400">
                No DEX rows were returned.
              </p>
            )}
          </aside>
        </div>
      )}

      {dexPaymentOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            className="flex-1"
            onClick={() => setDexPaymentOpen(false)}
            aria-label="Close DEX payment"
          />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#111] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  DEX settlement
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Import DEX Net-Off
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Upload the Net-Off workbook. DEX payments and seller
                  statements are created by the server.
                </p>
              </div>
              <button
                onClick={() => setDexPaymentOpen(false)}
                className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-xs text-neutral-400">
                Net-Off statement (.xlsx)
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => {
                    setDexStatementFile(event.target.files?.[0] || null);
                    setDexStatementObjectName("");
                    setDexPaymentResult(null);
                  }}
                  className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"
                />
              </label>
              <button
                disabled={
                  saving || !dexStatementFile || Boolean(dexStatementObjectName)
                }
                onClick={() => void uploadDexStatement()}
                className="rounded-md border border-white/10 px-3 py-2 text-xs text-white disabled:opacity-40"
              >
                {dexStatementObjectName
                  ? "Workbook uploaded"
                  : "Upload workbook"}
              </button>
              <button
                disabled={saving || !dexStatementObjectName}
                onClick={() => void importDexStatement()}
                className="w-full rounded-md bg-white px-3 py-3 text-sm font-semibold text-black disabled:opacity-40"
              >
                {saving ? "Importing…" : "Import DEX statement"}
              </button>
              {dexPaymentResult && (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  <p className="font-semibold">DEX statement imported</p>
                  <p className="mt-1">
                    {dexPaymentResult.matched_order_count ?? 0} matched ·{" "}
                    {dexPaymentResult.unmatched_tracking_count ?? 0} unmatched
                  </p>
                </div>
              )}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">
                    Imported statements
                  </p>
                  <button
                    onClick={() => void loadDexStatements()}
                    className="text-xs text-primary"
                  >
                    Refresh
                  </button>
                </div>
                {dexStatements.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-400">
                    No imported statements.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {dexStatements.map((statement) => (
                      <button
                        key={statement.id}
                        onClick={() => void selectDexStatement(statement.id)}
                        className="flex w-full items-center justify-between rounded-md border border-white/10 p-3 text-left hover:bg-white/5"
                      >
                        <span>
                          <span className="block font-mono text-xs text-white">
                            {statement.statement_number || statement.id}
                          </span>
                          <span className="mt-1 block text-xs text-neutral-400">
                            {dateTime(statement.created_at)}
                          </span>
                        </span>
                        <span className="text-right text-xs text-neutral-400">
                          {statement.matched_order_count ?? 0} matched
                          <br />
                          {statement.unmatched_tracking_count ?? 0} unmatched
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedDexStatement && (
                  <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3 text-xs text-neutral-300">
                    <p className="font-semibold text-white">Imported rows</p>
                    <p className="mt-1">
                      {selectedDexStatement.matched_order_count ?? 0} matched ·{" "}
                      {selectedDexStatement.unmatched_tracking_count ?? 0}{" "}
                      unmatched
                    </p>
                    <div className="mt-3 space-y-2">
                      {(selectedDexStatement.rows || []).map(
                        (row: any, index: number) => (
                          <div
                            key={`${row.tracking_number || index}-${index}`}
                            className="rounded border border-white/10 p-2"
                          >
                            <p className="font-mono text-white">
                              {row.tracking_number || "-"}
                            </p>
                            <p className="mt-1">
                              Normalized:{" "}
                              {row.normalized_tracking_number || "-"} ·{" "}
                              {row.match_status || "-"}
                            </p>
                            <p className="mt-1">
                              Order: {row.matched_order_id || "-"} · matched by:{" "}
                              {row.matched_by || "-"}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {brandStatementsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            className="flex-1"
            onClick={() => setBrandStatementsOpen(false)}
            aria-label="Close brand statements"
          />
          <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#111] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Finance
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Brand statements
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Server-calculated payouts for DEX-paid orders.
                </p>
              </div>
              <button
                onClick={() => setBrandStatementsOpen(false)}
                className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            {selectedBrandStatement && (
              <div className="mt-5 rounded-md border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">
                    Statement {selectedBrandStatement.id}
                  </p>
                  <span className="text-xs uppercase text-primary">
                    {selectedBrandStatement.status || "open"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/80">
                  Final brand transfer:{" "}
                  {money(
                    selectedBrandStatement.transfer_amount ??
                      selectedBrandStatement.amount,
                  )}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  Brand price minus Juno commission. DEX deductions are
                  reconciliation values, not payout deductions.
                </p>
                {selectedBankDetails && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Payment destination
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ["Bank name", selectedBankDetails.bank_name],
                        ["Account title", selectedBankDetails.account_title],
                        ["Account number", selectedBankDetails.account_number],
                        ["IBAN", selectedBankDetails.iban],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded border border-white/10 bg-black/20 p-2"
                        >
                          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                            {label}
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <code className="min-w-0 truncate text-xs text-white">
                              {value || "—"}
                            </code>
                            {value && (
                              <button
                                type="button"
                                onClick={() => void copyValue(String(value))}
                                aria-label={`Copy ${label.toLowerCase()}`}
                                title={`Copy ${label.toLowerCase()}`}
                                className="shrink-0 text-neutral-300 hover:text-white"
                              >
                                <Copy size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 space-y-2 text-xs text-neutral-300">
                  {(selectedBrandStatement.rows || []).map(
                    (row: any, index: number) => (
                      <div
                        key={`${row.order_id || row.tracking_number || index}-${index}`}
                        className="rounded border border-white/10 p-2"
                      >
                        <p className="font-mono text-white">
                          {row.tracking_number || row.order_id || "-"}
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                          <p>
                            <span className="block uppercase tracking-wide text-neutral-500">
                              Customer payment
                            </span>
                            COD {money(row.cod_amount)} · customer price{" "}
                            {money(row.customer_price)} · shipping{" "}
                            {money(row.shipping_fee)}
                          </p>
                          <p>
                            <span className="block uppercase tracking-wide text-neutral-500">
                              DEX reconciliation
                            </span>
                            Net {money(row.dex_paid)} · delivery fee{" "}
                            {money(row.delivery_fee)} · VAT {money(row.vat)} ·
                            income tax {money(row.income_tax)} · sales tax{" "}
                            {money(row.sales_tax)}
                          </p>
                          <p>
                            <span className="block uppercase tracking-wide text-neutral-500">
                              Brand payout
                            </span>
                            Brand price {money(row.brand_price)} · commission{" "}
                            {money(row.commission)} · transfer{" "}
                            {money(row.transfer_amount)}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  {selectedBrandStatement.payment_proof_url && (
                    <a
                      href={selectedBrandStatement.payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-white/10 px-3 py-2 text-xs text-white"
                    >
                      Open payment proof
                    </a>
                  )}
                  <button
                    onClick={() => void printBrandStatement("statement")}
                    className="rounded-md border border-white/10 px-3 py-2 text-xs text-white"
                  >
                    Print statement
                  </button>
                  <button
                    onClick={() => void printBrandStatement("invoice")}
                    className="rounded-md border border-white/10 px-3 py-2 text-xs text-white"
                  >
                    Print invoice
                  </button>
                </div>
                {selectedBrandStatement.status === "open" && (
                  <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                    <label className="block text-xs text-neutral-400">
                      Payment proof
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(event) => {
                          setStatementProofFile(
                            event.target.files?.[0] || null,
                          );
                          setStatementProofUrl("");
                        }}
                        className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"
                      />
                    </label>
                    <button
                      disabled={
                        saving ||
                        !statementProofFile ||
                        Boolean(statementProofUrl)
                      }
                      onClick={() => void uploadStatementProof()}
                      className="rounded-md border border-white/10 px-3 py-2 text-xs text-white disabled:opacity-40"
                    >
                      {statementProofUrl ? "Proof uploaded" : "Upload proof"}
                    </button>
                    <label className="block text-xs text-neutral-400">
                      Bank reference
                      <input
                        value={statementBankReference}
                        onChange={(event) =>
                          setStatementBankReference(event.target.value)
                        }
                        className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="block text-xs text-neutral-400">
                      Payment date
                      <input
                        type="date"
                        value={statementPaymentDate}
                        onChange={(event) =>
                          setStatementPaymentDate(event.target.value)
                        }
                        className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <button
                      disabled={
                        saving ||
                        !statementProofUrl ||
                        !statementBankReference.trim() ||
                        !statementPaymentDate
                      }
                      onClick={() => void payBrandStatement()}
                      className="w-full rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
                    >
                      Mark paid
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  Saved statements
                </p>
                <button
                  onClick={() => void loadBrandStatements()}
                  disabled={saving}
                  className="text-xs text-primary"
                >
                  Refresh
                </button>
              </div>
              {brandStatements.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-400">
                  No saved statements.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {brandStatements.map((statement) => (
                    <button
                      key={statement.id}
                      onClick={() => void selectBrandStatement(statement.id)}
                      className="flex w-full items-center justify-between rounded-md border border-white/10 p-3 text-left hover:bg-white/5"
                    >
                      <span>
                        <span className="block font-mono text-xs text-white">
                          {statement.id}
                        </span>
                        <span className="mt-1 block text-xs text-neutral-400">
                          {dateTime(statement.created_at)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-semibold text-white">
                          {money(statement.transfer_amount ?? statement.amount)}
                        </span>
                        <span className="text-xs uppercase text-primary">
                          {statement.status}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {dmDraftOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            className="flex-1"
            onClick={() => setDMDraftOpen(false)}
            aria-label="Close"
          />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#111] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  DM order
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Prepare a size-quiz link
                </h3>
              </div>
              <button
                onClick={() => setDMDraftOpen(false)}
                className="rounded-md border border-white/10 p-2 text-neutral-300"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-3 text-sm text-neutral-400">
              No order is created yet. The customer’s completed quiz chooses the
              size and creates the order.
            </p>
            <div className="mt-5 grid gap-3">
              {[
                ["product_id", "Product ID"],
                ["quantity", "Quantity"],
                ["full_name", "Customer name"],
                ["phone_number", "Phone number"],
                ["email", "Email"],
                ["address_line1", "Address line 1"],
                ["address_line2", "Address line 2"],
                ["city", "City"],
                ["province", "Province"],
                ["postal_code", "Postal code"],
                ["country", "Country"],
              ].map(([key, label]) => (
                <label key={key} className="text-xs text-neutral-400">
                  {label}
                  <input
                    type={key === "quantity" ? "number" : "text"}
                    min={key === "quantity" ? 1 : undefined}
                    value={(dmDraft as any)[key]}
                    onChange={(event) =>
                      setDMDraft((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
                  />
                </label>
              ))}
              <label className="text-xs text-neutral-400">
                Payment method
                <select
                  value={dmDraft.payment_method}
                  onChange={(event) =>
                    setDMDraft((current) => ({
                      ...current,
                      payment_method: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  <option value="cod">Cash on delivery</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </label>
            </div>
            {dmQuizLink ? (
              <div className="mt-5 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-xs text-emerald-200">
                  Share this with the customer
                </p>
                <p className="mt-2 break-all font-mono text-xs text-white">
                  {dmQuizLink}
                </p>
                <button
                  onClick={() => void navigator.clipboard.writeText(dmQuizLink)}
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"
                >
                  <Copy size={13} /> Copy link
                </button>
              </div>
            ) : (
              <button
                disabled={saving}
                onClick={() => void createDMDraft()}
                className="mt-5 w-full rounded-md bg-white px-3 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                {saving ? "Preparing…" : "Create size-quiz link"}
              </button>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
