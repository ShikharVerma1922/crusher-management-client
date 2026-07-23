import Select from "react-select";
import { Package } from "lucide-react"; // Or your icon library

const materialOptions = [
  { value: "all", label: "All Material" },
  { value: "10mm", label: "10mm" },
  { value: "20mm", label: "20mm" },
  { value: "6mm", label: "6mm" },
  { value: "copra", label: "Copra" },
  { value: "crm", label: "CRM" },
  { value: "dust", label: "Dust" },
  { value: "gsb", label: "GSB" },
  { value: "mix", label: "Mix" },
];

export default function MaterialFilterDropdown({
  materialFilter,
  setMaterialFilter,
}) {
  const isFiltered = materialFilter !== "all";

  // Custom styling object matching your industrial ERP monospace design
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "32px",
      height: "32px",
      fontSize: "12px",
      fontFamily: "monospace",
      fontWeight: "700",
      borderRadius: "0px", // Flat corners for industrial ERP feel
      borderColor: isFiltered ? "#2563eb" : "#cbd5e1",
      backgroundColor: isFiltered ? "#eff6ff" : "#ffffff",
      boxShadow: "none",
      "&:hover": {
        borderColor: isFiltered ? "#2563eb" : "#94a3b8",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 6px",
    }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorsContainer: (base) => ({ ...base, height: "30px" }),
    dropdownIndicator: (base) => ({ ...base, padding: "4px" }),
    menu: (base) => ({
      ...base,
      borderRadius: "0px",
      border: "2px solid #0f172a",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      fontSize: "12px",
      fontFamily: "monospace",
      fontWeight: "700",
      padding: "6px 10px",
      backgroundColor: state.isSelected
        ? "#0f172a"
        : state.isFocused
          ? "#f1f5f9"
          : "#ffffff",
      color: state.isSelected ? "#ffffff" : "#0f172a",
      cursor: "pointer",
    }),
  };

  return (
    <div style={styles.dropdownInputGroup}>
      <Package
        size={14}
        style={{ color: isFiltered ? "#2563eb" : "#64748b", marginRight: 6 }}
      />
      <div style={{ width: "160px" }}>
        <Select
          options={materialOptions}
          value={materialOptions.find((opt) => opt.value === materialFilter)}
          onChange={(selected) => setMaterialFilter(selected.value)}
          styles={customStyles}
          isSearchable={true}
          components={{ IndicatorSeparator: () => null }} // Clean layout without vertical separator line
        />
      </div>
    </div>
  );
}

const styles = {
  dropdownInputGroup: {
    display: "flex",
    alignItems: "center",
  },
};
