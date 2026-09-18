import React, { useEffect, useMemo, useState } from 'react';
import type { LivestockPartnership, User, UploadedFile, Review, FarmRecord } from '../types';
import { sharedWorkspaceApi } from '../services/sharedWorkspaceService';
import ReviewModal from './ReviewModal';
import { FmsTab } from './workspace/FmsTab';
import { WalletTab } from './workspace/WalletTab';
import { DisputesTab } from './workspace/DisputesTab';
import { ReviewsTab } from './workspace/ReviewsTab';

type Mode = 'fms' | 'wallet' | 'disputes' | 'reviews';

export default function ParticipantWorkspace({
  user,
  partnerships,
  mode,
}: {
  user: User;
  partnerships: LivestockPartnership[];
  mode: Mode;
}) {
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [wallet, setWallet] = useState<any>();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reviewData, setReviewData] = useState<{
    received: Review[];
    written: Review[];
    averageRating: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const participantFarmIds = useMemo(() => {
    return Array.from(new Set(partnerships.map((p) => `farm_${p.farmerId}`)));
  }, [partnerships]);

  const load = async () => {
    if (mode === 'fms') {
      const recordsResult = await sharedWorkspaceApi.records();
      const docResults = await Promise.all(
        (participantFarmIds.length > 0 ? participantFarmIds : [`farm_${user.id}`]).map((id) =>
          sharedWorkspaceApi.documents(id)
        )
      );
      if (recordsResult.data) setRecords(recordsResult.data);
      setDocuments(docResults.flatMap((r) => r.data || []));
    } else if (mode === 'wallet') {
      const r = await sharedWorkspaceApi.wallet();
      if (r.data) setWallet(r.data);
    } else if (mode === 'disputes') {
      const r = await sharedWorkspaceApi.disputes();
      if (r.data) setDisputes(r.data);
    } else if (mode === 'reviews') {
      const r = await sharedWorkspaceApi.reviews();
      if (r.data) setReviewData(r.data);
    }
  };

  useEffect(() => {
    void load();
  }, [mode, user.id, participantFarmIds.join(':')]);

  const act = async (fn: () => Promise<void>, msg?: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4" id="participant_modular_workspace">
      {mode === 'fms' && (
        <FmsTab
          user={user}
          records={records}
          documents={documents}
          participantFarmIds={participantFarmIds}
          busy={busy}
          onRefresh={load}
          act={act}
        />
      )}

      {mode === 'wallet' && (
        <WalletTab user={user} wallet={wallet} busy={busy} act={act} />
      )}

      {mode === 'disputes' && (
        <DisputesTab
          user={user}
          partnerships={partnerships}
          disputes={disputes}
          busy={busy}
          act={act}
        />
      )}

      {mode === 'reviews' && (
        <ReviewsTab
          user={user}
          reviewData={reviewData}
          onOpenReviewModal={() => setReviewModalOpen(true)}
        />
      )}

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
}
