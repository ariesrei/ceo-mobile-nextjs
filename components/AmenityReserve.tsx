"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listAmenities, type AmenityItem } from "@/lib/helpers/amenities";
import { formatAppError } from "@/lib/helpers/errors";
import {
  createReservation,
  getReservationSlots,
  type ReservationSlot,
  type ReservationSlots,
} from "@/lib/helpers/reservations";
import { Button } from "./ui/Button";
import { DateField } from "./ui/DateField";
import { Input } from "./ui/Input";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { Select } from "./ui/Select";

function stampFromDate(day: Date) {
  return `${String(day.getMonth() + 1).padStart(2, "0")}/${String(day.getDate()).padStart(2, "0")}/${day.getFullYear()}`;
}

function todayStamp() {
  const day = new Date();
  day.setHours(12, 0, 0, 0);
  return stampFromDate(day);
}

function addDays(from: Date, days: number) {
  const next = new Date(from);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

function addOneDay(mdy: string) {
  const [month, day, year] = mdy.split("/").map(Number);
  if (!month || !day || !year) return mdy;
  const date = new Date(year, month - 1, day + 1, 12);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function slotOptions(slots: ReservationSlot[]) {
  return slots.map((slot) => ({
    id: slot.value,
    label: slot.full ? `${slot.label} (waitlist)` : slot.label,
  }));
}

export function AmenityReserve({ amenityId }: { amenityId: number }) {
  const router = useRouter();
  const [item, setItem] = useState<AmenityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => todayStamp());
  const [people, setPeople] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [comments, setComments] = useState("");
  const [starts, setStarts] = useState<ReservationSlot[]>([]);
  const [ends, setEnds] = useState<ReservationSlot[]>([]);
  const [meta, setMeta] = useState<ReservationSlots | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [waitlistAck, setWaitlistAck] = useState(false);

  const peopleCount = Math.max(1, Number(people) || 1);
  const fromDate = useMemo(
    () => addDays(new Date(), meta?.minAdvance || 0),
    [meta?.minAdvance]
  );
  const toDate = useMemo(
    () =>
      meta?.displayDays
        ? addDays(new Date(), meta.displayDays)
        : undefined,
    [meta?.displayDays]
  );

  useEffect(() => {
    if (!amenityId) {
      setLoading(false);
      return;
    }
    listAmenities()
      .then((data) => {
        if (data.ok) {
          setItem(data.items.find((row) => row.id === amenityId) || null);
        }
      })
      .finally(() => setLoading(false));
  }, [amenityId]);

  useEffect(() => {
    if (!amenityId || !date) return;
    let live = true;
    setSlotsLoading(true);
    setError("");
    getReservationSlots({
      amenity: amenityId,
      date,
      people: peopleCount,
    }).then((data) => {
      if (!live) return;
      setMeta(data);
      setStarts(data.times);
      setStartTime((prev) => {
        if (data.changeover) return data.checkIn;
        return data.times.some((slot) => slot.value === prev) ? prev : "";
      });
      setEndTime((prev) => (data.changeover ? data.checkOut : prev));
      if (!data.changeover) setEnds([]);
      if (data.minAdvance > 0) {
        const earliest = stampFromDate(addDays(new Date(), data.minAdvance));
        setDate((prev) => {
          const [em, ed, ey] = earliest.split("/").map(Number);
          const [cm, cd, cy] = prev.split("/").map(Number);
          const earlyTs = new Date(ey, em - 1, ed).getTime();
          const curTs = new Date(cy, cm - 1, cd).getTime();
          return curTs < earlyTs ? earliest : prev;
        });
      }
      if (data.message) setError(data.message);
    }).finally(() => {
      if (live) setSlotsLoading(false);
    });
    return () => {
      live = false;
    };
  }, [amenityId, date, peopleCount]);

  useEffect(() => {
    if (!amenityId || !date || !startTime || meta?.changeover) return;
    let live = true;
    getReservationSlots({
      amenity: amenityId,
      date,
      people: peopleCount,
      mode: "end",
      startTime,
    }).then((data) => {
      if (!live) return;
      setEnds(data.times);
      setEndTime((prev) =>
        data.times.some((slot) => slot.value === prev) ? prev : ""
      );
    });
    return () => {
      live = false;
    };
  }, [amenityId, date, peopleCount, startTime, meta?.changeover]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amenityId || !date || !startTime || !endTime) return;
    setBusy(true);
    setError("");
    const res = await createReservation({
      amenity: amenityId,
      date,
      startTime,
      endTime,
      endDate: meta?.changeover ? addOneDay(date) : date,
      people: peopleCount,
      comments,
      waitlistAcknowledged: waitlistAck,
    });
    if (!res.ok) {
      if (res.error.status === 409) {
        setWaitlistAck(true);
      }
      setError(res.error ? formatAppError(res.error) : res.message);
      setBusy(false);
      return;
    }
    router.push("/account/reservations");
    router.refresh();
  }

  if (loading) return <ListSkeleton rows={1} height={220} />;
  if (!item) {
    return (
      <EmptyState icon="calendar" subtitle="It may have been removed or the link is old.">
        Amenity not found
      </EmptyState>
    );
  }

  const maxPeople = meta?.maxPeople || 20;
  const canSubmit = Boolean(date && startTime && endTime) && !slotsLoading && !busy;

  return (
    <div className="ceo-amenity-reserve">
      <article className="ceo-amenity__card">
        <div className="ceo-amenity__photo">
          {item.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photo} alt="" />
          ) : null}
        </div>
        <div className="ceo-amenity__body">
          <div>
            <h3>{item.title}</h3>
            <p>{item.hours}</p>
          </div>
        </div>
      </article>

      <form className="ceo-class-form" onSubmit={onSubmit}>
        <DateField
          label="Date"
          value={date}
          required
          fromDate={fromDate}
          toDate={toDate}
          showClear={false}
          onChange={(next) => {
            setDate(next);
            setWaitlistAck(false);
          }}
        />
        <Input
          label="People"
          name="people"
          type="number"
          min={1}
          max={maxPeople}
          required
          value={people}
          onChange={(e) => setPeople(e.target.value)}
        />
        {meta?.changeover ? (
          <p className="ceo-amenity__note">
            Stay booking: check-in {meta.checkIn || "set by amenity"}, check-out{" "}
            {meta.checkOut || "the next day"}.
          </p>
        ) : (
          <div className="ceo-form-row ceo-form-row--times">
            <Select
              label="Start"
              name="start_time"
              required
              disabled={slotsLoading || starts.length === 0}
              placeholder={slotsLoading ? "Loading…" : "Select time"}
              value={startTime}
              options={slotOptions(starts)}
              onChange={(e) => {
                setStartTime(e.target.value);
                setWaitlistAck(false);
              }}
            />
            <Select
              label="End"
              name="end_time"
              required
              disabled={!startTime || ends.length === 0}
              placeholder={startTime ? "Select time" : "Start first"}
              value={endTime}
              options={slotOptions(ends)}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        )}
        {!slotsLoading && !meta?.changeover && !meta?.limitReached && starts.length === 0 ? (
          <p className="ceo-amenity__note">No open times on this date.</p>
        ) : null}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="comments"
            value={comments}
            rows={3}
            onChange={(e) => setComments(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
          />
        </label>
        {error ? <p className="ceo-empty-note">{error}</p> : null}
        <Button type="submit" disabled={!canSubmit}>
          {busy
            ? "Saving…"
            : waitlistAck
              ? "Join waitlist"
              : "Reserve"}
        </Button>
      </form>
    </div>
  );
}
