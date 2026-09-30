"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ExhibitionDetail, ExhibitionSummary } from "./types";

export function useMyExhibitions(userId: string) {
  const [exhibitions, setExhibitions] = useState<ExhibitionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [newPublic, setNewPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExhibitionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [plantInput, setPlantInput] = useState("");
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  const loadList = useCallback(() => {
    setIsLoading(true);
    apiFetch(`/api/my-exhibitions?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setExhibitions(data.exhibitions || []))
      .catch(() => setExhibitions([]))
      .finally(() => setIsLoading(false));
  }, [userId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) loadList();
  }, [userId, loadList]);

  const loadDetail = (id: string) => {
    setDetailLoading(true);
    apiFetch(`/api/my-exhibitions/${id}`)
      .then((res) => res.json())
      .then((data) => setDetail(data.exhibition || null))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const toggleOpen = (id: string) => {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
    } else {
      setOpenId(id);
      loadDetail(id);
    }
  };

  const createExhibition = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await apiFetch("/api/my-exhibitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: newTitle, theme: newTheme || null, isPublic: newPublic }),
      });
      if (!res.ok) throw new Error();
      setNewTitle("");
      setNewTheme("");
      setNewPublic(false);
      setShowCreateForm(false);
      loadList();
    } catch {
      // erreur silencieuse : le formulaire reste ouvert, l'utilisateur peut réessayer
    } finally {
      setIsCreating(false);
    }
  };

  const deleteExhibition = async (id: string) => {
    await apiFetch(`/api/my-exhibitions/${id}?userId=${userId}`, { method: "DELETE" });
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
    }
    loadList();
  };

  const togglePublic = async (ex: ExhibitionSummary) => {
    await apiFetch(`/api/my-exhibitions/${ex.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isPublic: !ex.isPublic }),
    });
    loadList();
    if (openId === ex.id) loadDetail(ex.id);
  };

  const addPlant = async (exhibitionId: string) => {
    if (!plantInput.trim()) return;
    setIsAddingPlant(true);
    try {
      const res = await apiFetch(`/api/my-exhibitions/${exhibitionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, scientificName: plantInput.trim() }),
      });
      if (!res.ok) throw new Error();
      setPlantInput("");
      loadDetail(exhibitionId);
      loadList();
    } catch {
      // erreur silencieuse
    } finally {
      setIsAddingPlant(false);
    }
  };

  const removePlant = async (exhibitionId: string, itemId: string) => {
    await apiFetch(`/api/my-exhibitions/${exhibitionId}/items/${itemId}?userId=${userId}`, {
      method: "DELETE",
    });
    loadDetail(exhibitionId);
    loadList();
  };

  const sharePublicLink = (id: string) => {
    const url = `${window.location.origin}/exposition/${id}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const [qrOpenId, setQrOpenId] = useState<string | null>(null);

  return {
    exhibitions, isLoading, showCreateForm, setShowCreateForm, newTitle, setNewTitle,
    newTheme, setNewTheme, newPublic, setNewPublic, isCreating, openId, detail,
    detailLoading, plantInput, setPlantInput, isAddingPlant, copiedId, qrOpenId, setQrOpenId,
    createExhibition, deleteExhibition, togglePublic, addPlant, removePlant,
    sharePublicLink, toggleOpen,
  };
}
