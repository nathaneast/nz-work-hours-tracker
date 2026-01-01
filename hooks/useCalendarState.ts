import { useEffect, useMemo, useState } from "react";
import type { Job, PayDetails, Region, WorkLog } from "../types";
import {
  NZ_NATIONAL_HOLIDAYS,
  NZ_PROVINCIAL_HOLIDAYS,
  NZ_REGIONS,
} from "../constants";
import { calculateWeeklyPay } from "../services/payCalculator";
import { getStartOfWeek, toYYYYMMDD } from "../utils";

type CalendarStateProps = {
  jobs: Job[];
  workLog: WorkLog;
  initialRegion?: Region;
  weekStartDay?: number;
};

export type CalendarState = {
  currentDate: Date;
  week: Date[];
  changeWeek: (direction: "prev" | "next") => void;
  selectedDate: Date | null;
  isModalOpen: boolean;
  handleDayClick: (date: Date) => void;
  handleModalClose: () => void;
  payDetails: PayDetails;
  selectedRegion: Region;
  setSelectedRegion: (region: Region) => void;
  isRegionSelectorVisible: boolean;
  setIsRegionSelectorVisible: (visible: boolean) => void;
  allHolidays: { date: string; name: string; region?: string }[];
  holidayName?: string;
  regions: Region[];
};

export const useCalendarState = ({
  jobs,
  workLog,
  initialRegion,
  weekStartDay = 1,
}: CalendarStateProps): CalendarState => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payDetails, setPayDetails] = useState<PayDetails>({
    grossPay: 0,
    ordinaryPay: 0,
    publicHolidayPremium: 0,
    holidayPay: 0,
    tax: 0,
    accLevy: 0,
    netPay: 0,
    totalHours: 0,
    holidayHours: 0,
    jobBreakdown: [],
  });
  const [selectedRegion, setSelectedRegion] = useState<Region>(
    initialRegion ?? "None"
  );
  const [isRegionSelectorVisible, setIsRegionSelectorVisible] =
    useState(false);

  const startOfWeek = useMemo(
    () => getStartOfWeek(currentDate, weekStartDay),
    [currentDate, weekStartDay]
  );
  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setUTCDate(startOfWeek.getUTCDate() + i);
      return day;
    });
  }, [startOfWeek]);

  const allHolidays = useMemo(() => {
    if (selectedRegion === "None") {
      return NZ_NATIONAL_HOLIDAYS;
    }
    const provincial = NZ_PROVINCIAL_HOLIDAYS.filter(
      (h) => h.region === selectedRegion
    );
    return [...NZ_NATIONAL_HOLIDAYS, ...provincial];
  }, [selectedRegion]);

  const holidayMap = useMemo(
    () => new Map(allHolidays.map((h) => [h.date, h.name])),
    [allHolidays]
  );

  useEffect(() => {
    const details = calculateWeeklyPay(workLog, jobs, week, allHolidays);
    setPayDetails(details);
  }, [workLog, jobs, week, allHolidays]);

  const changeWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setUTCDate(
        newDate.getUTCDate() + (direction === "next" ? 7 : -7)
      );
      return newDate;
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  useEffect(() => {
    setSelectedRegion(initialRegion ?? "None");
  }, [initialRegion]);

  const holidayName = selectedDate
    ? holidayMap.get(toYYYYMMDD(selectedDate))
    : undefined;

  return {
    currentDate,
    week,
    changeWeek,
    selectedDate,
    isModalOpen,
    handleDayClick,
    handleModalClose,
    payDetails,
    selectedRegion,
    setSelectedRegion,
    isRegionSelectorVisible,
    setIsRegionSelectorVisible,
    allHolidays,
    holidayName,
    regions: NZ_REGIONS,
  };
};
