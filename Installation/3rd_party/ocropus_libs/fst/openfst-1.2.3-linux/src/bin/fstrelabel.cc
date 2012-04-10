// fstrelabel.cc

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright 2005-2010 Google, Inc.
// Author: johans@google.com (Johan Schalkwyk)
// Modified: jpr@google.com (Jake Ratkiewicz) to use FstClass
//
// \file
// Relabel input or output space of Fst
//

#include <string>
#include <vector>
using std::vector;
#include <utility>
using std::pair; using std::make_pair;

#include <fst/script/relabel.h>
#include <fst/script/weight-class.h>
#include <fst/util.h>

DEFINE_string(isymbols, "", "Input label symbol table");
DEFINE_string(osymbols, "", "Output label symbol table");
DEFINE_string(relabel_isymbols, "", "Input symbol set to relabel to");
DEFINE_string(relabel_osymbols, "", "Ouput symbol set to relabel to");
DEFINE_string(relabel_ipairs, "", "Input relabel pairs (numeric)");
DEFINE_string(relabel_opairs, "", "Output relabel pairs (numeric)");

DEFINE_bool(allow_negative_labels, false,
            "Allow negative labels (not recommended; may cause conflicts)");

int main(int argc, char **argv) {
  namespace s = fst::script;
  using fst::SymbolTable;
  using fst::script::FstClass;
  using fst::script::MutableFstClass;
  using fst::script::VectorFstClass;

  string usage = "Relabel the input and/or the output labels of the Fst.\n";
  usage += " Usage: ";
  usage += argv[0];
  usage += " [in.fst [out.fst]]\n";
  usage += " Using SymbolTables flags:\n";
  usage += "  -relabel_isymbols isyms.txt\n";
  usage += "  -relabel_osymbols osyms.txt\n";
  usage += " Using numeric labels flags:\n";
  usage += "  -relabel_ipairs   ipairs.txt\n";
  usage += "  -relabel_opairs   opairs.txts\n";

  std::set_new_handler(FailedNewHandler);
  SetFlags(usage.c_str(), &argc, &argv, true);
  if (argc > 3) {
    ShowUsage();
    return 1;
  }

  string in_name = strcmp(argv[1], "-") == 0 ? "" : argv[1];
  string out_name = argc > 2 ? argv[2] : "";

  FstClass *ifst = FstClass::Read(in_name);
  if (!ifst) {
    return 0;
  }

  MutableFstClass *ofst = 0;
  if (ifst->Properties(fst::kMutable, false)) {
    ofst = static_cast<MutableFstClass *>(ifst);
  } else {
    ofst = new VectorFstClass(*ifst);
    delete ifst;
  }

  // Relabel with symbol tables
  if (!FLAGS_relabel_isymbols.empty() || !FLAGS_relabel_osymbols.empty()) {
    bool attach_new_isymbols = (ifst->InputSymbols() != 0);
    const SymbolTable* old_isymbols = FLAGS_isymbols.empty()
        ? ifst->InputSymbols()
        : SymbolTable::ReadText(FLAGS_isymbols, FLAGS_allow_negative_labels);
    const SymbolTable* relabel_isymbols = FLAGS_relabel_isymbols.empty()
        ? NULL
        : SymbolTable::ReadText(FLAGS_relabel_isymbols,
                                FLAGS_allow_negative_labels);

    bool attach_new_osymbols = (ofst->OutputSymbols() != 0);
    const SymbolTable* old_osymbols = FLAGS_osymbols.empty()
        ? ofst->OutputSymbols()
        : SymbolTable::ReadText(FLAGS_osymbols, FLAGS_allow_negative_labels);
    const SymbolTable* relabel_osymbols = FLAGS_relabel_osymbols.empty()
        ? NULL
        : SymbolTable::ReadText(FLAGS_relabel_osymbols,
                                FLAGS_allow_negative_labels);

    s::Relabel(ofst,
               old_isymbols, relabel_isymbols, attach_new_isymbols,
               old_osymbols, relabel_osymbols, attach_new_osymbols);
  } else {
    // read in relabel pairs and parse
    typedef int64 Label;
    vector<pair<Label, Label> > ipairs;
    vector<pair<Label, Label> > opairs;
    if (!FLAGS_relabel_ipairs.empty())
      fst::ReadLabelPairs(FLAGS_relabel_ipairs, &ipairs,
                              FLAGS_allow_negative_labels);
    if (!FLAGS_relabel_opairs.empty())
      fst::ReadLabelPairs(FLAGS_relabel_opairs, &opairs,
                              FLAGS_allow_negative_labels);

    s::Relabel(ofst, ipairs, opairs);
  }

  ofst->Write(out_name);

  return 0;
}
