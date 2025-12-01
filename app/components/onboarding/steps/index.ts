// app/components/onboarding/steps/index.ts
import React, { type ReactNode } from "react";
import { ChoiceStep } from "./ChoiceStep";
import { JoinEmailStep } from "./JoinEmailStep";
import { AccessRequestSentStep } from "./AccessRequestSentStep";
import { CreateCompanyAndLocation } from "./CreateCompanyAndLocation";
import { OnboardingSuccessfulStep } from "./OnboardingSuccessfulStep";

const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type StepId =
  | "choice"
  | "join_email"
  | "access_request_sent"
  | "create_company"
  | "finished";

export type CompanyFormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  employeesBand: string;
};

export type LocationFormState = {
  title: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  activityId?: string;
  typeId?: string;
};

export type OnboardingFlowState = {
  selectedOption: "join" | "create" | null;
  joinEmailInput: string;
  joinEmails: string[];
  companyForm: CompanyFormState;
  locationForm: LocationFormState;
  companyId?: string;
  locationCreated?: boolean;
};

export type OnboardingStepProps = {
  state: OnboardingFlowState;
  setState: (patch: Partial<OnboardingFlowState>) => void;
};

export type OnboardingStepDefinition = {
  id: StepId;
  render: (props: OnboardingStepProps) => ReactNode;
  canGoNext: (state: OnboardingFlowState) => boolean;
  getTitle?: (ctx: { userName: string }) => string;
  getSubtitle?: (ctx: { userName: string }) => string | undefined;
};

export const onboardingSteps: OnboardingStepDefinition[] = [
  {
    id: "choice",
    render: (props) => React.createElement(ChoiceStep, props),
    canGoNext: (state) =>
      state.selectedOption === "join" || state.selectedOption === "create",
    getTitle: ({ userName }) => `Bienvenido, ${userName}`,
    getSubtitle: () =>
      "Cuéntanos algo más sobre tu situación para conectar tu cuenta correctamente.",
  },

  {
    id: "join_email",
    render: (props) => React.createElement(JoinEmailStep, props),
    canGoNext: (state) =>
      state.joinEmails.length > 0 ||
      basicEmailRegex.test(state.joinEmailInput.trim()),
    getTitle: () => "Ayúdanos a localizar tu empresa",
    getSubtitle: () =>
      "Añade correos de personas de tu empresa para solicitar acceso.",
  },

  {
    id: "access_request_sent",
    render: () => React.createElement(AccessRequestSentStep),
    canGoNext: () => false,
    getTitle: () => "Solicitud enviada",
    getSubtitle: () => undefined,
  },

  {
    id: "create_company",
    render: (props) => React.createElement(CreateCompanyAndLocation, props),
    // Botón "Crear" habilitado solo cuando todos los datos están rellenos
    canGoNext: (state) => {
      const c = state.companyForm;
      const l = state.locationForm;
      return (
        c.name.trim().length > 0 &&
        c.employeesBand.trim().length > 0 &&
        l.title.trim().length > 0 &&
        l.address.trim().length > 0 &&
        !!l.activityId &&
        !!l.typeId
      );
    },
    getTitle: () => "Crea tu empresa y establecimiento",
    getSubtitle: () =>
      "Añade el nombre de tu empresa y de tu primer establecimiento.",
  },

  {
    id: "finished",
    render: (props) => React.createElement(OnboardingSuccessfulStep, props),
    canGoNext: () => true,
    getTitle: () => "¡Todo listo! 🎉",
    getSubtitle: () =>
      "Hemos creado tu empresa y tu primer establecimiento. Ya puedes empezar a trabajar con Crussader.",
  },
];

export const initialOnboardingState: OnboardingFlowState = {
  selectedOption: null,
  joinEmailInput: "",
  joinEmails: [],
  companyForm: {
    name: "",
    email: "",
    phone: "",
    address: "",
    employeesBand: "",
  },
  locationForm: {
    title: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    website: "",
    activityId: undefined,
    typeId: undefined,
  },
  companyId: undefined,
  locationCreated: false,
};
