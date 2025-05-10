// frontend/src/components/admin/utils/LanguagePicker.jsx

import { useState, Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const options = [
    { label: "Català",   code: "ca" },
    { label: "Español",  code: "es" },
    { label: "English",  code: "en" },
];

export default function LanguagePicker({ onChange, selectedCode }) {
    const initial = options.find((opt) => opt.code === selectedCode) || options[0];
    const [selected, setSelected] = useState(initial);

    const handleChange = (opt) => {
        setSelected(opt);
        onChange(opt.code);
    };

    return (
        <div className="w-48 relative">
            <Listbox value={selected} onChange={handleChange}>
                <div className="relative">
                    <Listbox.Button className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <span>{selected.label}</span>
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    </Listbox.Button>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                            {options.map((opt) => (
                                <Listbox.Option
                                    key={opt.code}
                                    value={opt}
                                    className={({ active }) =>
                                        `cursor-pointer select-none relative px-3 py-2 text-sm ${
                                            active ? "bg-indigo-100 text-indigo-900" : "text-gray-700"
                                        }`
                                    }
                                >
                                    {({ selected: isSel }) => (
                                        <span className={`${isSel ? "font-semibold" : "font-normal"}`}>
                      {opt.label}
                    </span>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
}
