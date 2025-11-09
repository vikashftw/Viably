/**
 * PNC Branch Appointment Scheduler
 * Allows customers to schedule in-branch appointments
 *
 * Integration: PNC Branch Management System, Google Calendar API
 * Compliance: SOC 2, GLBA
 * Features: Real-time availability, calendar sync, SMS reminders
 */

import React, { useState, useEffect } from 'react';
import { Calendar } from '@pnc/calendar-component';
import { BranchService } from '../services/BranchService';
import { useAuth } from '@pnc/auth-context';

interface TimeSlot {
  time: Date;
  available: boolean;
  duration: number; // minutes
}

interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration: number;
  requiresSpecialist: boolean;
  category: 'general' | 'loans' | 'investments' | 'business';
}

interface Branch {
  branchId: string;
  name: string;
  address: string;
  phone: string;
}

const APPOINTMENT_TYPES: AppointmentType[] = [
  {
    id: 'general',
    name: 'General Banking',
    description: 'Account questions, debit cards, general assistance',
    duration: 15,
    requiresSpecialist: false,
    category: 'general'
  },
  {
    id: 'mortgage',
    name: 'Mortgage Consultation',
    description: 'Home loans, refinancing, mortgage questions',
    duration: 45,
    requiresSpecialist: true,
    category: 'loans'
  },
  {
    id: 'business',
    name: 'Business Banking',
    description: 'Business accounts, merchant services, commercial lending',
    duration: 30,
    requiresSpecialist: true,
    category: 'business'
  },
  {
    id: 'investment',
    name: 'Investment Planning',
    description: 'Retirement, investment strategy, wealth management',
    duration: 60,
    requiresSpecialist: true,
    category: 'investments'
  }
];

export function AppointmentScheduler() {
  const { user } = useAuth();
  const [step, setStep] = useState<'type' | 'branch' | 'time' | 'confirm'>('type');
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBranch && selectedDate && selectedType) {
      loadAvailableSlots();
    }
  }, [selectedBranch, selectedDate, selectedType]);

  const loadAvailableSlots = async () => {
    if (!selectedBranch || !selectedDate || !selectedType) return;

    try {
      setLoading(true);
      const slots = await BranchService.getAvailability({
        branchId: selectedBranch.branchId,
        date: selectedDate,
        appointmentType: selectedType.id,
        duration: selectedType.duration
      });

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!selectedType || !selectedBranch || !selectedTime) return;

    try {
      setLoading(true);

      const appointment = await BranchService.scheduleAppointment({
        customerId: user.customerId,
        branchId: selectedBranch.branchId,
        appointmentType: selectedType.id,
        startTime: selectedTime.time,
        duration: selectedType.duration,
        notes: '',
        notificationPreferences: {
          email: true,
          sms: true,
          calendarInvite: true
        }
      });

      console.log('Appointment scheduled:', appointment);
      // Show success message
      setStep('confirm');
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-scheduler">
      <h1>Schedule a Branch Appointment</h1>

      <ProgressIndicator
        steps={['Service', 'Branch', 'Date & Time', 'Confirm']}
        currentStep={step}
      />

      {step === 'type' && (
        <div className="step-content">
          <h2>What can we help you with?</h2>
          <div className="appointment-types">
            {APPOINTMENT_TYPES.map(type => (
              <AppointmentTypeCard
                key={type.id}
                type={type}
                selected={selectedType?.id === type.id}
                onSelect={() => {
                  setSelectedType(type);
                  setStep('branch');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {step === 'branch' && (
        <div className="step-content">
          <h2>Select a Branch</h2>
          <BranchSelector
            appointmentType={selectedType!}
            onSelect={(branch) => {
              setSelectedBranch(branch);
              setStep('time');
            }}
            onBack={() => setStep('type')}
          />
        </div>
      )}

      {step === 'time' && (
        <div className="step-content">
          <h2>Choose Date & Time</h2>
          <div className="time-picker">
            <Calendar
              minDate={new Date()}
              maxDate={addDays(new Date(), 30)}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
            />

            {selectedDate && (
              <div className="time-slots">
                <h3>{formatDate(selectedDate)}</h3>
                {loading ? (
                  <div>Loading available times...</div>
                ) : availableSlots.length > 0 ? (
                  <div className="slots-grid">
                    {availableSlots.map((slot, index) => (
                      <TimeSlotButton
                        key={index}
                        slot={slot}
                        selected={selectedTime === slot}
                        onSelect={() => setSelectedTime(slot)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-slots">
                    No availability on this date. Please select another date.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="actions">
            <button onClick={() => setStep('branch')}>Back</button>
            <button
              onClick={handleScheduleAppointment}
              disabled={!selectedTime || loading}
            >
              Schedule Appointment
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && selectedBranch && selectedTime && selectedType && (
        <div className="step-content confirmation">
          <div className="success-icon">✓</div>
          <h2>Appointment Scheduled!</h2>

          <div className="appointment-details">
            <DetailRow label="Service" value={selectedType.name} />
            <DetailRow label="Branch" value={selectedBranch.name} />
            <DetailRow label="Address" value={selectedBranch.address} />
            <DetailRow
              label="Date & Time"
              value={formatDateTime(selectedTime.time)}
            />
            <DetailRow
              label="Duration"
              value={`${selectedType.duration} minutes`}
            />
          </div>

          <div className="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>Check your email for confirmation and calendar invite</li>
              <li>You'll receive an SMS reminder 24 hours before</li>
              <li>Bring a valid ID and relevant documents</li>
              <li>Call {selectedBranch.phone} if you need to reschedule</li>
            </ul>
          </div>

          <div className="actions">
            <button onClick={() => window.location.href = '/'}>
              Return to Home
            </button>
            <button onClick={() => setStep('type')}>
              Schedule Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AppointmentTypeCardProps {
  type: AppointmentType;
  selected: boolean;
  onSelect: () => void;
}

function AppointmentTypeCard({ type, selected, onSelect }: AppointmentTypeCardProps) {
  return (
    <div
      className={`appointment-type-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <h3>{type.name}</h3>
      <p>{type.description}</p>
      <div className="meta">
        <span>{type.duration} minutes</span>
        {type.requiresSpecialist && <span className="badge">Specialist</span>}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
