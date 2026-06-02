import { BankOutlined, EnvironmentOutlined, NumberOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { VerifiedCompanyBadge } from '../../../components/common/VerifiedCompanyBadge'
import { COMPANY_REGISTRATION } from '../constants/companyRegistration'

export function CompanyVerificationSection() {
  return (
    <section
      id="verification"
      className="overflow-visible bg-gradient-to-b from-blue-50/50 to-emerald-50/40 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Company Verification
          </p>
          <h2 className="mb-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Registered &amp; Verified in the UK
          </h2>
          <p className="mx-auto max-w-xl text-slate-600">
            BizTrack is operated by a UK-registered company for transparency and trust.
          </p>
        </div>

        <div className="overflow-visible rounded-xl border-2 border-blue-200/80 bg-white shadow-lg">
          <div className="h-1.5 rounded-t-lg bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500" />
          <div className="overflow-visible p-6 sm:p-10">
            <div className="mb-8 flex flex-col items-center gap-6 overflow-visible text-center sm:flex-row sm:items-start sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <SafetyCertificateOutlined className="text-4xl" />
              </div>
              <div className="flex-1 space-y-3 overflow-visible">
                <VerifiedCompanyBadge align="center" className="sm:mx-0" tooltipPosition="below" />
                <p className="text-sm text-slate-600">
                  Official registration details are listed below for your assurance.
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <BankOutlined className="mt-0.5 shrink-0 text-lg text-blue-600" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registered company
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {COMPANY_REGISTRATION.registeredCompany}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <NumberOutlined className="mt-0.5 shrink-0 text-lg text-blue-600" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Company number
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {COMPANY_REGISTRATION.companyNumber}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:col-span-2">
                <SafetyCertificateOutlined className="mt-0.5 shrink-0 text-lg text-emerald-600" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Authority
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {COMPANY_REGISTRATION.authority}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:col-span-2">
                <EnvironmentOutlined className="mt-0.5 shrink-0 text-lg text-emerald-600" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registered office
                  </dt>
                  <dd className="mt-1 text-sm font-medium leading-relaxed text-slate-900">
                    {COMPANY_REGISTRATION.registeredOfficeAddress}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
