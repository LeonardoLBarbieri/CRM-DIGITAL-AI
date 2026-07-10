"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportLeadsButtonProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function ImportLeadsButton({ onSuccess, onClose }: ImportLeadsButtonProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      let allData: any[] = [];
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        
        // Get raw rows
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rows.length === 0) continue;
        
        const firstRow = rows[0];
        const hasHeaders = firstRow.some(cell => {
          const str = String(cell).toLowerCase();
          return str.includes("nome") || str.includes("telefone") || str.includes("celular");
        });
        
        if (hasHeaders) {
           const json = XLSX.utils.sheet_to_json(worksheet);
           allData = allData.concat(json);
        } else {
           for (const row of rows) {
             if (!row || row.length === 0) continue;
             allData.push({
               nome: row[0] || "", 
               telefone: row[1] || "",
               outros: row[2] || ""
             });
           }
        }
      }

      if (allData.length === 0) {
        alert("O arquivo está vazio ou não possui o formato correto.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allData),
      });

      if (!res.ok) {
        throw new Error("Erro ao importar leads");
      }

      const result = await res.json();
      alert(`Importação concluída! ${result.count} contatos adicionados com sucesso.`);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao importar os contatos. Verifique o formato do arquivo.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-emerald-500/10 flex items-center gap-3 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={16} className="text-emerald-400 animate-spin" />
        ) : (
          <Upload size={16} className="text-emerald-400" />
        )}
        Importar CSV/Excel
      </button>
    </>
  );
}
