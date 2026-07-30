'use client';

import React, { useEffect } from 'react';

export default function LeadGuide() {
  useEffect(() => {
    (window as any).switchTab = function (tabId: string) {
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(el => el.classList.remove('active'));
      const buttons = document.querySelectorAll('.tab-btn');
      buttons.forEach(el => el.classList.remove('active'));
      const targetContent = document.getElementById('tab-content-' + tabId);
      if (targetContent) targetContent.classList.add('active');
      const activeButton = Array.from(buttons).find(btn => btn.textContent?.trim().toLowerCase().includes(tabId.toLowerCase()));
      if (activeButton) activeButton.classList.add('active');
    };
    (window as any).clearNotes = function () {
      const el = document.getElementById('notesContent') as HTMLTextAreaElement;
      if (el) el.value = '';
      console.log('Notes Cleared');
    };
    (window as any).saveNotes = function () {
      const content = (document.getElementById('notesContent') as HTMLTextAreaElement)?.value || '';
      if (content.trim() === '') {
        alert('Please write some content before saving.');
      } else {
        alert('Note Saved Successfully!\nContent: ' + content);
      }
    };
    (window as any).clearTaskInputs = function () {
      const title = document.getElementById('taskTitle') as HTMLInputElement;
      const details = document.getElementById('taskDetails') as HTMLTextAreaElement;
      if (title) title.value = '';
      if (details) details.value = '';
      console.log('Task Inputs Cleared');
    };
    (window as any).deleteTask = function () {
      if (confirm('Are you sure you want to delete this task?')) {
        const card = document.getElementById('taskCard');
        if (card) card.remove();
        console.log('Task Deleted from UI');
      }
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <style>{`
        body { font-family: 'Inter', sans-serif; background-color: #e5e7eb; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .blue-gradient { background: linear-gradient(90deg, #3b82f6, #2563eb); }
        .pill-status-open { background-color: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
        .pill-try { background-color: #fee2e2; color: #dc2626; }
        .btn-outline-primary { border: 1px solid #3b82f6; color: #3b82f6; }
        .btn-outline-primary:hover { background-color: #eff6ff; }
        .map-placeholder {
          background-color: #f8fafc;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239aa0a6' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .sidebar-item:hover { background-color: #f9fafb; }
        .sidebar-item.active { background-color: #f3f4f6; border-left: 3px solid #3b82f6; color: #1f2937; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .tab-btn { position: relative; cursor: pointer; color: #6b7280; transition: color 0.2s; }
        .tab-btn:hover { color: #374151; }
        .tab-btn.active { color: #2563eb; font-weight: 500; }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -9px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #2563eb;
        }
        select.call-result-dropdown:focus-visible {
          outline: 2px solid #ef4444;
        }
        .call-result-dropdown option:checked {
          background-color: #0284c7;
          color: white;
        }
      `}</style>

      {/* 1. SIDEBAR */}
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 shrink-0 h-full z-20">
        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg mb-8">A</div>
        <div className="flex flex-col gap-6 text-gray-500 text-lg w-full items-center">
          <a href="#" className="w-full flex justify-center py-2 hover:text-blue-600 transition"><i className="fa-regular fa-file-lines"></i></a>
          <a href="#" className="w-full flex justify-center py-2 sidebar-item active"><i className="fa-solid fa-house"></i></a>
          <a href="#" className="w-full flex justify-center py-2 hover:text-blue-600 transition"><i className="fa-regular fa-copy"></i></a>
          <a href="#" className="w-full flex justify-center py-2 hover:text-blue-600 transition"><i className="fa-regular fa-flag"></i></a>
          <a href="#" className="w-full flex justify-center py-2 hover:text-blue-600 transition"><i className="fa-solid fa-globe"></i></a>
          <a href="#" className="w-full flex justify-center py-2 hover:text-blue-600 transition"><i className="fa-regular fa-user"></i></a>
          <a href="#" className="w-full flex justify-center py-2 hover:text-blue-600 transition"><i className="fa-solid fa-gear"></i></a>
          <a href="#" className="w-full flex justify-center py-2 hover:text-blue-600 transition"><i className="fa-regular fa-heart"></i></a>
          <a href="#" className="w-full flex justify-center py-2 hover:text-blue-600 transition"><i className="fa-solid fa-graduation-cap"></i></a>
        </div>
      </aside>

      {/* 2. MAIN WRAPPER */}
      <div className="flex-1 flex flex-col h-full bg-[#e5e7eb] overflow-hidden">

        {/* TOP HEADER */}
        <header className="bg-white px-6 py-3 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-bars text-gray-500 text-base cursor-pointer"></i>
              AGENTLOCATOR
            </div>
            <div className="ml-4 border-l pl-4 border-gray-300">
              <button className="text-blue-500 flex items-center gap-1 text-sm font-medium"><i className="fa-solid fa-filter"></i> APPLY SAVED FILTER <i className="fa-solid fa-chevron-down text-xs"></i></button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-blue-500">
            <button className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center text-sm hover:bg-blue-50"><i className="fa-regular fa-circle-question"></i></button>
            <button className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center text-sm hover:bg-blue-50"><i className="fa-solid fa-earth-americas"></i></button>
            <button className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center text-sm hover:bg-blue-50"><i className="fa-regular fa-comment-dots"></i></button>
            <button className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center text-sm hover:bg-blue-50"><i className="fa-regular fa-calendar"></i></button>
            <button className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center text-sm hover:bg-blue-50"><i className="fa-regular fa-envelope"></i></button>
            <button className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center text-sm hover:bg-blue-50"><i className="fa-regular fa-user"></i></button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* MAIN 8-COLUMN GRID LAYOUT */}
          <div className="grid grid-cols-12 gap-4 max-w-[1600px] mx-auto">

            {/* LEFT COLUMN (Spans 4 columns) */}
            <div className="col-span-4 flex flex-col gap-4">

              {/* Blue Banner */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="bg-blue-500 text-white px-4 py-2.5 flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2"><i className="fa-regular fa-circle-question"></i> Home Locator Mobile App Info</span>
                  <div className="flex items-center gap-3"><i className="fa-regular fa-circle-question"></i> <i className="fa-solid fa-chevron-down"></i></div>
                </div>
                <div className="p-3 flex justify-between items-center bg-white border-t border-gray-100 text-xs">
                  <span className="text-gray-600">Lead activity: <span className="font-semibold text-gray-900">Not active</span></span>
                  <span className="text-gray-500">Last time link generated: <span className="font-medium text-gray-800">7/26/2026</span></span>
                </div>
                <div className="p-3 pt-0 pb-4 bg-white">
                  <a href="#" className="text-blue-600 text-sm font-medium hover:underline">Get App Link</a>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex justify-between border-b border-gray-100 pb-3 mb-1">
                  <input type="text" defaultValue="Gagandeep" className="w-[48%] text-base text-gray-800 outline-none bg-transparent font-medium" />
                  <input type="text" defaultValue="Kaur" className="w-[48%] text-base text-gray-800 outline-none bg-transparent font-medium" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm"><i className="fa-solid fa-phone text-green-500"></i> 4379997361</div>
                  <button className="text-gray-400 hover:text-blue-500" onClick={() => console.log('Edit Phone Clicked')}><i className="fa-regular fa-pen-to-square"></i></button>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm"><i className="fa-solid fa-at text-green-500"></i> simmi.gagan@gmail.com</div>
                  <div className="flex gap-2 text-gray-400">
                    <button className="hover:text-blue-500" onClick={() => console.log('Edit Email Clicked')}><i className="fa-regular fa-pen-to-square"></i></button>
                    <button className="hover:text-blue-500" onClick={() => console.log('Send Email Clicked')}><i className="fa-regular fa-envelope"></i></button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-blue-600 text-sm font-medium">
                  <button className="flex items-center gap-1 hover:text-blue-800" onClick={() => alert('Add Additional Contact clicked')}><i className="fa-solid fa-plus"></i> Additional Contact</button>
                  <button className="flex items-center gap-1 hover:text-blue-800" onClick={() => alert('Add Address clicked')}><i className="fa-solid fa-plus"></i> Add an address</button>
                </div>
                <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
                  <div className="flex gap-1.5">
                    <button className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-gray-400"><i className="fa-regular fa-bookmark"></i></button>
                    <span className="w-7 h-7 rounded-full bg-cyan-400 text-white flex items-center justify-center text-[10px] font-bold">S</span>
                    <span className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold">L</span>
                    <button className="w-7 h-7 rounded-full bg-transparent text-blue-500 flex items-center justify-center hover:bg-blue-50 text-lg">+</button>
                  </div>
                  <div className="flex gap-2 text-gray-400 text-sm">
                    <button className="hover:text-gray-600" onClick={() => console.log('Image Icon Clicked')}><i className="fa-regular fa-image"></i></button>
                    <button className="hover:text-gray-600" onClick={() => console.log('Calendar Icon Clicked')}><i className="fa-regular fa-calendar-days"></i></button>
                    <button className="hover:text-gray-600" onClick={() => console.log('Comment Icon Clicked')}><i className="fa-regular fa-comment"></i></button>
                    <button className="hover:text-gray-600" onClick={() => console.log('File Icon Clicked')}><i className="fa-regular fa-file-lines"></i></button>
                    <button className="hover:text-gray-600" onClick={() => console.log('Phone Icon Clicked')}><i className="fa-solid fa-phone"></i></button>
                  </div>
                </div>
                <div className="mt-3">
                  <textarea id="leadDescription" className="w-full border border-gray-200 rounded p-2 text-sm text-gray-700 outline-none focus:border-blue-500 resize-none h-20 text-xs placeholder-gray-400 bg-gray-50" placeholder="Lead Description..."></textarea>
                </div>
              </div>

              {/* Activity Card (Red) */}
              <div className="bg-[#ef4444] text-white rounded-lg p-4 flex gap-4 shadow-sm relative border border-red-500 items-start">
                <div className="shrink-0 pt-1 text-xl"><i className="fa-regular fa-clock"></i></div>
                <div className="text-sm">
                  <div className="font-medium mb-1">07/27/2026 10:08 PM</div>
                  <div className="opacity-90 mb-0.5">Title: Call</div>
                  <div className="opacity-90 mb-0.5">Status: In Progress</div>
                  <div className="opacity-90">User: Gurleen Nagpal</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="font-medium text-gray-800 text-sm mb-2">Lead Stats</div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    Gagandeep Kaur is a lead from 1 day ago who registered on 7/26/2026 at 11:05 PM. Last contacted 18 hours ago. Lead has had a total of 2 calls, 4 emails, &amp; 3 SMS messages.
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="font-medium text-gray-800 text-sm mb-1">Last property view - 1 day ago</div>
                    <div className="text-xs text-gray-600 mb-3">This lead has looked at <span className="text-blue-500 font-medium">2</span> properties: <br /> <span className="font-medium text-gray-800">2</span> <span className="text-gray-500">Condos</span> <span className="text-gray-400">|</span> <span className="font-medium text-gray-800">2</span> <span className="text-gray-500">3 Beds, 4 Baths</span><br /> <span className="font-medium text-gray-800">401K</span> to <span className="font-medium text-gray-800">445K</span> <br /> in Brampton.</div>
                  </div>
                  <button className="w-full text-blue-500 border border-blue-500 rounded py-1.5 text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-50 transition" onClick={() => alert('More details clicked')}><i className="fa-regular fa-circle-question"></i> More details</button>
                </div>
              </div>

              {/* Pipeline & Integration Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="font-medium text-gray-800 text-sm mb-3">Pipeline</div>
                  <div className="flex justify-between items-center bg-red-100 text-red-700 rounded px-3 py-2 text-xs font-medium">
                    Tried to contact (07/26/2026) <i className="fa-solid fa-chevron-down"></i>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="font-medium text-gray-800 text-sm mb-3">CRM Integrations</div>
                  <button className="w-full text-blue-500 border border-blue-500 rounded py-1.5 text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-50 transition" onClick={() => alert('Setup Clicked')}><i className="fa-solid fa-arrow-right-to-bracket"></i> Setup</button>
                </div>
              </div>

              {/* Saved Listings Search */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-medium text-gray-800 text-sm">Saved Listing Searches</div>
                  <button className="text-blue-500 border border-blue-500 rounded px-3 py-1 text-xs font-medium hover:bg-blue-50 transition" onClick={() => alert('Add New Search Clicked')}><i className="fa-solid fa-plus mr-1"></i> Add New Search</button>
                </div>
                <div className="flex gap-4 pt-2 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg shrink-0">
                    <i className="fa-regular fa-circle-check"></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm text-gray-800">Brampton, Condo</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">Lead <i className="fa-regular fa-circle-check text-green-500"></i></div>
                      </div>
                      <div className="flex gap-1 text-[10px] text-gray-500">
                        <button className="w-5 h-5 rounded-full border border-red-300 text-red-500 flex items-center justify-center hover:bg-red-50" onClick={() => console.log('Remove Search Clicked')}><i className="fa-solid fa-xmark"></i></button>
                        <button className="w-5 h-5 rounded-full border border-red-300 text-red-500 flex items-center justify-center hover:bg-red-50" onClick={() => console.log('Restore Search Clicked')}><i className="fa-solid fa-rotate-left"></i></button>
                        <button className="w-5 h-5 rounded-full border border-red-300 text-red-500 flex items-center justify-center hover:bg-red-50" onClick={() => console.log('External Link Clicked')}><i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i></button>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 flex gap-2">
                      <span className="bg-gray-100 px-1.5 rounded">1</span> <span className="text-gray-400">&bull;</span> Brampton <span className="text-gray-400">&bull;</span> <span className="text-gray-700 font-medium">$400,000 - $500,000</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2 flex gap-1"><span className="bg-gray-100 px-1 rounded">2 other criteria</span> <span className="bg-gray-100 px-1 rounded"><i className="fa-solid fa-tag text-[8px]"></i> 68</span></div>
                    <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-100 pt-1">
                      <div>Details:</div>
                      <div className="flex justify-between"><span className="text-gray-400">emails sent 2</span> <span className="text-gray-400">&bull;</span> last sent at <span className="font-medium text-gray-700">07/27/2026 11:20:00 PM</span></div>
                      <div className="flex justify-between mt-0.5"><span className="text-gray-400">next at</span> <span className="font-medium text-gray-700">07/28/2026 11:20:00 PM</span></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (Spans 8 columns) */}
            <div className="col-span-8 flex flex-col gap-4">

              {/* Top Action & Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-800 text-sm">Notes & Calls (2)</div>
                  <button className="text-blue-500 border border-blue-500 rounded px-4 py-1 text-xs font-medium hover:bg-blue-50 transition" onClick={() => alert('Load Lead Navigation clicked')}><i className="fa-regular fa-circle-check mr-1"></i> Load Lead Navigation</button>
                </div>

                {/* UPDATED: Tab Navigation Buttons */}
                <div className="flex gap-6 border-b border-gray-100 pb-2 mb-4 text-sm text-gray-500">
                  <button className="tab-btn active" onClick={() => (window as any).switchTab('notes')}>Notes & Calls (2)</button>
                  <button className="tab-btn" onClick={() => (window as any).switchTab('timeline')}>Timeline</button>
                  <button className="tab-btn" onClick={() => (window as any).switchTab('tasks')}>Tasks</button>
                  <button className="tab-btn" onClick={() => (window as any).switchTab('emails')}>E-mails (4)</button>
                  <button className="tab-btn" onClick={() => (window as any).switchTab('sms')}>SMS (3)</button>
                  <button className="tab-btn" onClick={() => (window as any).switchTab('ecampaigns')}>E-campaigns</button>
                  <button className="tab-btn" onClick={() => (window as any).switchTab('sold')}>Sold Details</button>
                </div>

                {/* 1. NOTES & CALLS TAB */}
                <div id="tab-content-notes" className="tab-content active">
                  <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline mb-4" onClick={() => (window as any).switchTab('sold')}>Sold Details</div>

                  {/* Input Form Row */}
                  <div className="flex flex-wrap gap-3 mb-3 items-center">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-1.5 text-xs">
                      <input type="radio" name="comm_type" id="note" className="accent-blue-600" /> <label htmlFor="note">Note</label>
                      <input type="radio" name="comm_type" id="call" className="accent-blue-600" defaultChecked /> <label htmlFor="call">Call</label>
                    </div>

                    {/* UPDATED DATE/TIME PICKER */}
                    <input type="datetime-local" defaultValue="2026-07-29T11:47" id="notesDateTime" className="border border-blue-400 rounded px-2 py-1.5 text-xs text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500" />

                    {/* UPDATED CALL RESULT DROPDOWN */}
                    <select id="callResult" className="call-result-dropdown border border-red-400 rounded px-2 py-1.5 text-xs bg-gray-100 text-gray-700 outline-none focus:border-red-500 min-w-[140px]">
                      <option value="Lead Called In" selected className="bg-[#0284c7] text-white">Lead Called In</option>
                      <option value="Connected">Connected</option>
                      <option value="Interested">Interested</option>
                      <option value="Attempted">Attempted</option>
                      <option value="Called (No message left)">Called (No message left)</option>
                      <option value="Opt Out - Do not call">Opt Out - Do not call</option>
                      <option value="Lead Is Not There">Lead Is Not There</option>
                      <option value="Talked to Lead">Talked to Lead</option>
                      <option value="Wrong Number">Wrong Number</option>
                      <option value="Left Voice Mail">Left Voice Mail</option>
                      <option value="SMS Message" disabled className="text-gray-400">SMS Message</option>
                    </select>
                  </div>

                  <div className="relative border border-gray-200 rounded-lg bg-gray-50 p-2 mb-3 h-28">
                    <textarea id="notesContent" className="w-full h-full bg-transparent outline-none text-sm text-gray-600 resize-none" placeholder="Content..."></textarea>
                    <div className="absolute right-3 bottom-3 text-xs text-gray-400">0</div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200" onClick={() => (window as any).clearNotes()}>Clear</button>
                    <button className="px-4 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600" onClick={() => (window as any).saveNotes()}>Save</button>
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-4 space-y-4">
                    {/* Item 1 */}
                    <div className="flex gap-3 border-b border-gray-100 pb-4">
                      <div className="text-blue-500 pt-0.5"><i className="fa-regular fa-clock"></i></div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-800 leading-relaxed mb-1">A call was made from <span className="font-medium">+1437997361</span> to <span className="font-medium">97155697341</span> via the Twilio number 2097075666. The call is in progress. The call duration was 0 seconds.</div>
                        <div className="text-xs text-gray-500"><span className="font-medium text-blue-600">CALL RESULT:</span> Lead Called In</div>
                        <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                          <span>CREATED BY <span className="font-medium text-gray-700">Gurleen Nagpal</span></span>
                          <span><i className="fa-regular fa-clock mr-1"></i> 07/27/2026 5:53 AM</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-gray-300 text-[10px] pt-0.5">
                        <button className="hover:text-blue-500" onClick={() => console.log('Edit Note 1 Clicked')}><i className="fa-regular fa-pen-to-square"></i></button>
                        <button className="hover:text-red-500" onClick={() => console.log('Delete Note 1 Clicked')}><i className="fa-regular fa-trash-can"></i></button>
                      </div>
                    </div>
                    {/* Item 3 */}
                    <div className="flex gap-3 border-b border-gray-100 pb-4">
                      <div className="text-blue-500 pt-0.5"><i className="fa-regular fa-clock"></i></div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-800 leading-relaxed mb-1">Agent Gurleen Nagpal initiated a call to lead Gagandeep Kaur with phone number <span className="font-medium">4379997361</span>. The call lasted for 34 seconds. The agent added the following note: <span className="italic text-gray-500">&quot;Called, not available&quot;</span>.</div>
                        <div className="text-xs text-gray-500"><span className="font-medium text-blue-600">CALL RESULT:</span> Called (No message left)</div>
                        <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                          <span>CREATED BY <span className="font-medium text-gray-700">Gurleen Nagpal</span></span>
                          <span><i className="fa-regular fa-clock mr-1"></i> 07/27/2026 3:48 AM</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-gray-300 text-[10px] pt-0.5">
                        <button className="hover:text-blue-500" onClick={() => console.log('Edit Note 2 Clicked')}><i className="fa-regular fa-pen-to-square"></i></button>
                        <button className="hover:text-red-500" onClick={() => console.log('Delete Note 2 Clicked')}><i className="fa-regular fa-trash-can"></i></button>
                      </div>
                    </div>
                    <div className="flex justify-center mt-2">
                      <button className="px-4 py-1.5 border border-blue-500 text-blue-500 rounded-full text-xs font-medium hover:bg-blue-50 transition" onClick={() => alert('System notes hidden (Demo)')}>Hide system notes</button>
                    </div>
                  </div>
                </div>

                {/* 2. TIMELINE TAB */}
                <div id="tab-content-timeline" className="tab-content">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="pb-3 font-medium">Pipeline Status</th>
                        <th className="pb-3 font-medium">Date of Change (Local)</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-3">Tried to contact</td>
                        <td className="py-3">07/26/2026 11:06 PM</td>
                        <td className="py-3 text-right text-blue-500">
                          <button className="hover:text-blue-700 mr-3" onClick={() => console.log('Edit Timeline 1')}><i className="fa-regular fa-pen-to-square"></i></button>
                          <button className="hover:text-red-500" onClick={() => console.log('Delete Timeline 1')}><i className="fa-regular fa-trash-can"></i></button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">New Lead</td>
                        <td className="py-3">07/26/2026 11:05 PM</td>
                        <td className="py-3 text-right text-gray-300">
                          <button className="hover:text-blue-500 mr-3" onClick={() => console.log('Edit Timeline 2')}><i className="fa-regular fa-pen-to-square"></i></button>
                          <button className="hover:text-red-500" onClick={() => console.log('Delete Timeline 2')}><i className="fa-regular fa-trash-can"></i></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. TASKS TAB */}
                <div id="tab-content-tasks" className="tab-content space-y-6">
                  <div>
                    <input id="taskTitle" type="text" className="w-full bg-gray-100 border border-gray-200 rounded p-2 text-sm text-gray-600 placeholder-gray-400 outline-none" placeholder="Enter Title of new task..." />
                  </div>
                  <div>
                    <textarea id="taskDetails" className="w-full bg-gray-100 border border-gray-200 rounded p-2 text-sm text-gray-600 placeholder-gray-400 outline-none h-28 resize-none" placeholder="Task details..."></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <select className="w-full border border-blue-300 rounded p-2 text-sm text-gray-700 bg-white outline-none"><option>Asad Zaman</option></select>
                      <select className="w-full border border-blue-300 rounded p-2 text-sm text-gray-700 bg-white outline-none"><option>No reminder</option></select>
                    </div>
                    <div className="space-y-3">
                      <select className="w-full border border-blue-300 rounded p-2 text-sm text-gray-700 bg-white outline-none"><option>Not Started</option></select>
                      <input type="datetime-local" defaultValue="2026-07-28T10:00" className="w-full border border-blue-300 rounded p-2 text-sm text-gray-700 bg-white outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-3 pt-2">
                    <i className="fa-regular fa-circle-question text-gray-400 text-lg"></i>
                    <button className="px-4 py-1.5 border border-blue-300 text-blue-500 rounded text-sm font-medium hover:bg-blue-50" onClick={() => alert('Task Saved!')}>Save</button>
                    <button className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50" onClick={() => (window as any).clearTaskInputs()}>Clear</button>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div id="taskCard" className="border border-gray-200 rounded shadow-sm p-4">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-gray-800">Call</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500"><i className="fa-solid fa-gem text-yellow-400 text-[10px]"></i> Normal Priority</div>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded">In Progress</span>
                        <div className="text-xs text-gray-500 flex items-center gap-1"><i className="fa-regular fa-clock"></i> 07/27/2026 10:08 PM <span className="text-red-500 font-medium ml-1">OVERDUE</span></div>
                      </div>
                      <div className="text-sm text-gray-700 mb-3">Call test</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 border-t border-gray-100 pt-2 mb-3">
                        <i className="fa-regular fa-user-circle"></i> Gurleen Nagpal <span className="text-gray-300">&bull;</span> <i className="fa-regular fa-calendar"></i> 18 hours ago
                      </div>
                      <div className="flex border-t border-gray-200 divide-x divide-gray-200 text-xs text-gray-500">
                        <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-gray-50 text-blue-500" onClick={() => console.log('Edit Task Clicked')}><i className="fa-regular fa-pen-to-square"></i> Edit</button>
                        <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-gray-50" onClick={() => alert('Task Completed!')}><i className="fa-solid fa-check"></i> Complete</button>
                        <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-gray-50 text-blue-500" onClick={() => console.log('Push Task Clicked')}><i className="fa-solid fa-arrow-right-from-bracket"></i> Push</button>
                        <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-gray-50" onClick={() => (window as any).deleteTask()}><i className="fa-regular fa-trash-can"></i> Delete</button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button className="px-3 py-1 bg-blue-300 text-white rounded text-xs font-medium cursor-not-allowed" onClick={() => console.log('Previous task')}>Previous</button>
                      <button className="px-3 py-1 bg-blue-300 text-white rounded text-xs font-medium cursor-not-allowed" onClick={() => console.log('Next task')}>Next</button>
                    </div>
                    <div className="text-center mt-4">
                      <button className="border border-blue-500 text-blue-500 rounded px-4 py-1 text-xs font-medium hover:bg-blue-50" onClick={() => alert('Show completed tasks')}>Show completed</button>
                    </div>
                  </div>
                </div>

                {/* 4. EMAILS TAB */}
                <div id="tab-content-emails" className="tab-content">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                    <div className="flex gap-6 text-sm">
                      <span className="text-blue-600 font-medium border-b-2 border-blue-600 pb-3 -mb-3.5 cursor-pointer">Outgoing (4)</span>
                      <span className="text-gray-500 cursor-pointer hover:text-gray-800">Incoming (0)</span>
                    </div>
                    <button className="border border-blue-500 text-blue-500 rounded px-3 py-1 text-sm font-medium hover:bg-blue-50" onClick={() => alert('Compose Email Clicked')}><i className="fa-solid fa-plus mr-1"></i> Compose</button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 border-b border-gray-100 pb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">NI</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800"><i className="fa-regular fa-envelope text-blue-500"></i> NEW! New listings for...</div>
                        <div className="text-xs text-gray-500 mb-1">To: simmi.gagan@gmail.com</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded font-medium block mb-1">Delivered (21 hours ago)</span>
                        <span className="text-xs text-gray-500 block">07/27/2026 11:21 PM <i className="fa-solid fa-reply-all text-gray-400 ml-1 text-[10px]" onClick={() => console.log('Reply All Clicked')}></i></span>
                      </div>
                    </div>
                    <div className="flex gap-3 border-b border-gray-100 pb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">NI</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800"><i className="fa-regular fa-envelope text-blue-500"></i> NEW! New listings for...</div>
                        <div className="text-xs text-gray-500 mb-1">To: simmi.gagan@gmail.com</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-medium block mb-1">Opened (1 day ago)</span>
                        <span className="text-xs text-gray-500 block">07/26/2026 11:21 PM <i className="fa-solid fa-reply-all text-gray-400 ml-1 text-[10px]" onClick={() => console.log('Reply All Clicked')}></i></span>
                      </div>
                    </div>
                    <div className="flex gap-3 border-b border-gray-100 pb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">NI</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800"><i className="fa-regular fa-envelope text-blue-500"></i> Welcome to search.re...</div>
                        <div className="text-xs text-gray-500 mb-1">To: simmi.gagan@gmail.com</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded font-medium block mb-1">Delivered (1 day ago)</span>
                        <span className="text-xs text-gray-500 block">07/26/2026 11:09 PM <i className="fa-solid fa-reply-all text-gray-400 ml-1 text-[10px]" onClick={() => console.log('Reply All Clicked')}></i></span>
                      </div>
                    </div>
                    <div className="flex gap-3 border-b border-gray-100 pb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">NI</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800"><i className="fa-regular fa-envelope text-blue-500"></i> search.realestatewithi...</div>
                        <div className="text-xs text-gray-500 mb-1">To: simmi.gagan@gmail.com</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-medium block mb-1">Opened (1 day ago)</span>
                        <span className="text-xs text-gray-500 block">07/26/2026 11:05 PM <i className="fa-solid fa-reply-all text-gray-400 ml-1 text-[10px]" onClick={() => console.log('Reply All Clicked')}></i></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mt-4">
                    <button className="border border-blue-500 text-blue-500 rounded px-4 py-1 text-sm font-medium hover:bg-blue-50" onClick={() => alert('Show 3 months history')}>Show three months</button>
                  </div>
                </div>

                {/* 5. SMS TAB */}
                <div id="tab-content-sms" className="tab-content">
                  <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-4 text-sm">
                    <span className="text-gray-600">Receive SMS</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-500 left-5" />
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-500 cursor-pointer"></label>
                    </div>
                    <span className="text-blue-500 font-medium text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">YES</span>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    <div className="flex flex-col items-end mb-4">
                      <div className="flex items-center gap-1 text-[10px] text-green-600 mb-1"><i className="fa-solid fa-check"></i> Delivered</div>
                      <div className="bg-blue-100 rounded-xl rounded-tr-none p-3 max-w-[90%] text-sm text-gray-700 relative">
                        Hi Gagandeep! An automatic listing alert has already been created on your behalf, and I just want to make sure I'm sending you the correct listings on search.realestatewithiqbal.com. Are you only looking for Condo Apartment properties in Brampton? Also, what would be your ideal price range? - Naeem
                        <div className="text-[10px] text-gray-500 text-right mt-1">07/26/2026 11:13 PM</div>
                      </div>
                      <i className="fa-regular fa-circle-info text-blue-400 absolute right-0 top-2"></i>
                    </div>
                    <div className="text-center text-xs text-gray-400 my-4">Yesterday</div>
                    <div className="flex flex-col items-end mb-4 relative">
                      <div className="flex items-center gap-1 text-[10px] text-green-600 mb-1"><i className="fa-solid fa-check"></i> Delivered</div>
                      <div className="bg-blue-100 rounded-xl rounded-tr-none p-3 max-w-[90%] text-sm text-gray-700">
                        Hello Gagandeep, this is Asad calling on behalf of Naeem Iqbal Realtor. I'm just following up on your recent real estate inquiry. Whether you're looking for your dream home, an investment property, or simply exploring your options, we're here to help. Please give me a call back when it's convenient for you. I look forward to speaking with you. Have a great day!
                        <div className="text-[10px] text-gray-500 text-right mt-1">Yesterday, 3:50 AM</div>
                      </div>
                      <i className="fa-regular fa-circle-info text-blue-400 absolute right-0 top-2"></i>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-4 text-xs text-gray-600">
                    You cannot send SMS messages since you did not set up your Twilio account. To set up a Twilio account please click <a href="#" className="text-blue-500 hover:underline" onClick={() => alert('Twilio Setup Redirect')}>here</a>.
                  </div>
                </div>

                {/* 6. E-CAMPAIGNS TAB */}
                <div id="tab-content-ecampaigns" className="tab-content">
                  <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-4">
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white w-64 outline-none"><option>Select Campaign</option></select>
                    <button className="border border-blue-500 text-blue-500 rounded px-4 py-1.5 text-sm font-medium flex items-center gap-1 hover:bg-blue-50" onClick={() => alert('Assign Campaign Clicked')}><i className="fa-regular fa-circle-plus text-lg"></i> Assign</button>
                  </div>
                  <div className="flex justify-end gap-4 text-sm mb-4 text-gray-500">
                    <span className="flex items-center gap-1 text-red-500 cursor-pointer" onClick={() => console.log('Stop Campaign')}><i className="fa-solid fa-xmark"></i> Stop</span>
                    <span className="flex items-center gap-1 text-yellow-500 cursor-pointer" onClick={() => console.log('Listing Exception Click')}><i className="fa-solid fa-ban"></i> Listing Exception</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="pb-2 w-8"><input type="checkbox" className="rounded border-gray-300" /></th>
                        <th className="pb-2 text-left font-medium">Campaign Name</th>
                        <th className="pb-2 text-left font-medium">Status</th>
                        <th className="pb-2 text-left font-medium">Date Assigned</th>
                        <th className="pb-2 text-left font-medium">Progress</th>
                        <th className="pb-2 text-left font-medium">Assigned By</th>
                        <th className="pb-2 text-center font-medium">Stop</th>
                        <th className="pb-2 text-center font-medium">Start</th>
                        <th className="pb-2 text-center font-medium">Force</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="py-3 font-medium text-gray-800">Auto Assigned Ne...</td>
                        <td className="py-3 text-blue-600 flex items-center gap-1"><i className="fa-solid fa-link"></i> In Progress</td>
                        <td className="py-3 text-gray-600">07/26/2026</td>
                        <td className="py-3 flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> 10% (3/28)</td>
                        <td className="py-3 text-gray-600">Naeem Iqbal</td>
                        <td className="py-3 text-center text-blue-500 cursor-pointer" onClick={() => console.log('Stop Campaign Action')}><i className="fa-solid fa-xmark"></i></td>
                        <td className="py-3 text-center text-blue-500 cursor-pointer" onClick={() => console.log('Start Campaign Action')}><i className="fa-solid fa-check"></i></td>
                        <td className="py-3 text-center text-blue-500 cursor-pointer" onClick={() => console.log('Force Campaign Action')}><i className="fa-solid fa-rotate-right"></i></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 7. SOLD DETAILS TAB */}
                <div id="tab-content-sold" className="tab-content">
                  <div className="flex justify-end mb-4">
                    <button className="border border-blue-500 text-blue-500 rounded px-4 py-1 text-sm font-medium hover:bg-blue-50" onClick={() => alert('Add a Sale clicked')}><i className="fa-solid fa-plus mr-1"></i> Add a Sale</button>
                  </div>
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="pb-3 font-medium">Agent Role</th>
                        <th className="pb-3 font-medium">Closing Date</th>
                        <th className="pb-3 font-medium">MLS Number</th>
                        <th className="pb-3 font-medium">Selling Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-xs">No sales recorded yet.</td></tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Bottom Tabs & Map Area (Two Columns) */}
              <div className="grid grid-cols-12 gap-4 pb-2">

                {/* Left: Data Tabs */}
                <div className="col-span-7 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="flex border-b border-gray-200">
                    <div className="px-4 py-2.5 text-xs font-medium text-blue-600 border-b-2 border-blue-600 cursor-pointer">Lead Data</div>
                    <div className="px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer">More Details</div>
                    <div className="px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer">Buyer Info</div>
                    <div className="px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer">Seller Info</div>
                    <div className="px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer">Custom Fields</div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <div className="text-gray-500 mb-0.5">Status:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"><option>Open</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Lead Rating:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Ref. source:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"><option>Google</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Source:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>AL-Brampton-Condo...</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">House to sell:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>Unknown</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Lead type:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"><option>Home Buyer</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Buying in:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Selling in:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Mortgage type:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Owns/Rents:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Work phone:</div>
                      <input type="text" className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500" placeholder="Work phone" />
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Home phone:</div>
                      <input type="text" className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500" placeholder="Home phone" />
                    </div>
                  </div>
                </div>

                {/* Right: Map */}
                <div className="col-span-5 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative flex flex-col">
                  <div className="text-[10px] text-gray-500 text-right p-2 pb-0 absolute top-0 right-0 z-10 bg-white/80 rounded-bl">IP Address: 2607:fa80:70bc:2a00:8dba:74d:5abd:672</div>
                  <div className="flex-1 map-placeholder min-h-[280px] relative">
                    {/* Simulated Map Pins */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <i className="fa-solid fa-location-dot text-blue-500 text-3xl drop-shadow-md"></i>
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 bg-white/80 px-2 py-0.5 rounded border border-gray-200">
                      Leaflet | &copy; OpenStreetMap contributors
                    </div>
                  </div>
                </div>
              </div>

              {/* Agents & Delete Area */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-7 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="font-medium text-gray-800 text-sm mb-3">Agents</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-b border-gray-100 pb-4 mb-0">
                    <div>
                      <div className="text-gray-500 mb-0.5">Main agent:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"><option>Naeem Iqbal</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">List Agent:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Mort. agent:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500"><option>Not selected</option></select>
                    </div>
                  </div>
                </div>
                <div className="col-span-5 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-end justify-end">
                  <button className="border border-red-300 text-red-500 rounded px-4 py-1.5 text-xs font-medium hover:bg-red-50 transition" onClick={() => alert('Delete lead clicked')}>Delete</button>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 text-center text-[10px] text-gray-500 pb-2">
            &copy; 2026 - AgentLocator | <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> | <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>
          </div>

        </div>
      </div>

      {/* Floating Help Button */}
      <button className="fixed bottom-6 right-6 bg-blue-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition text-lg z-50" onClick={() => console.log('Help Button Clicked')}>
        <i className="fa-regular fa-circle-question"></i>
      </button>

    </div>
  );
}
