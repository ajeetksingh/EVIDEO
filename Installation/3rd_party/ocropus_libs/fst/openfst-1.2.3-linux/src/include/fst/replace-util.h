// replace-util.h


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
// Author: riley@google.com (Michael Riley)
//

// \file
// Utility classes for the recursive replacement of Fsts (RTNs).

#ifndef FST_LIB_REPLACE_UTIL_H__
#define FST_LIB_REPLACE_UTIL_H__

#include <vector>
using std::vector;
#include <tr1/unordered_map>
using std::tr1::unordered_map;
#include <tr1/unordered_set>
using std::tr1::unordered_set;

#include <fst/connect.h>
#include <fst/mutable-fst.h>
#include <fst/topsort.h>

namespace fst {

template <class Arc>
void Replace(const vector<pair<typename Arc::Label, const Fst<Arc>* > >&,
             MutableFst<Arc> *, typename Arc::Label, bool);


// Utility class for the recursive replacement of Fsts (RTNs). The
// user provides a set of Label, Fst pairs at construction. These are
// used by methods for testing cyclic dependencies and connectedness
// and doing RTN connection and specific Fst replacement by label or
// for various optimization properties. The modified results can be
// obtained with the GetFstPairs() or GetMutableFstPairs() methods.
template <class Arc>
class ReplaceUtil {
 public:
  typedef typename Arc::Label Label;
  typedef typename Arc::Weight Weight;
  typedef typename Arc::StateId StateId;

  typedef pair<Label, const Fst<Arc>*> FstPair;
  typedef pair<Label, MutableFst<Arc>*> MutableFstPair;
  typedef unordered_map<Label, Label> NonTerminalHash;

  // Constructs from mutable Fsts; Fst ownership given to ReplaceUtil.
  ReplaceUtil(const vector<MutableFstPair> &fst_pairs,
              Label root_label, bool epsilon_on_replace = false);

  // Constructs from Fsts; Fst ownership retained by caller.
  ReplaceUtil(const vector<FstPair> &fst_pairs,
              Label root_label, bool epsilon_on_replace = false);

  // Constructs from ReplaceFst internals; ownership retained by caller.
  ReplaceUtil(const vector<const Fst<Arc> *> &fst_array,
              const NonTerminalHash &nonterminal_hash, Label root_fst,
              bool epsilon_on_replace = false);

  ~ReplaceUtil() {
    for (Label i = 0; i < fst_array_.size(); ++i)
      delete fst_array_[i];
  }

  // True if the non-terminal dependencies are cyclic. Cyclic
  // dependencies will result in an unexpandable replace fst.
  bool CyclicDependencies() const {
    GetDependencies();
    return depprops_ & kCyclic;
  }

  // Returns true if no useless Fsts, states or transitions.
  bool Connected() const {
    GetDependencies();
    uint64 props = kAccessible | kCoAccessible;
    for (Label i = 0; i < fst_array_.size(); ++i) {
      if (!fst_array_[i])
        continue;
      if (fst_array_[i]->Properties(props, true) != props || !depaccess_[i])
        return false;
    }
    return true;
  }

  // Removes useless Fsts, states and transitions.
  void Connect();

  // Replaces Fsts specified by labels.
  void ReplaceLabels(const vector<Label> &labels);

  // Replaces singleton Fsts.
  void ReplaceTrivial();

  // Replaces non-terminals that have only one instance.
  void ReplaceUnique();

  // Returns Label, Fst pairs; Fst ownership retained by ReplaceUtil.
  void GetFstPairs(vector<FstPair> *fst_pairs);

  // Returns Label, MutableFst pairs; Fst ownership given to caller.
  void GetMutableFstPairs(vector<MutableFstPair> *mutable_fst_pairs);

 private:
  // Per Fst statistics
  struct ReplaceStats {
    StateId nstates;    // # of states
    StateId nfinal;     // # of final states
    size_t narcs;       // # of arcs
    Label nnonterms;    // # of non-terminals in Fst
    Label nref;         // # of non-terminal instances referring to this Fst

    ReplaceStats()
        : nstates(0),
          nfinal(0),
          narcs(0),
          nnonterms(0),
          nref(0) {}
  };

  // Check Mutable Fsts exist o.w. create them.
  void CheckMutableFsts();

  // Computes the dependency graph of the replace Fsts and related
  // information.
  void GetDependencies() const;

  void ClearDependencies() {
    depfst_.DeleteStates();
    stats_.clear();
    depprops_ = 0;
  }

  Label root_label_;                              // root non-terminal
  Label root_fst_;                                // root Fst ID
  bool epsilon_on_replace_;                       // see Replace()
  vector<const Fst<Arc> *> fst_array_;            // Fst per ID
  vector<MutableFst<Arc> *> mutable_fst_array_;   // MutableFst per ID
  vector<Label> nonterminal_array_;               // Fst ID to non-terminal
  NonTerminalHash nonterminal_hash_;              // non-terminal to Fst ID
  mutable VectorFst<Arc> depfst_;                 // Fst ID dependencies
  mutable vector<bool> depaccess_;                // Fst ID accessibility
  mutable uint64 depprops_;                       // dependency Fst props
  mutable vector<ReplaceStats> stats_;            // Per Fst statistics

  DISALLOW_COPY_AND_ASSIGN(ReplaceUtil);
};

template <class Arc>
ReplaceUtil<Arc>::ReplaceUtil(
    const vector<MutableFstPair> &fst_pairs,
    Label root_label, bool epsilon_on_replace)
    : root_label_(root_label),
      epsilon_on_replace_(epsilon_on_replace),
      depprops_(0) {
  fst_array_.push_back(0);
  mutable_fst_array_.push_back(0);
  nonterminal_array_.push_back(kNoLabel);
  for (Label i = 0; i < fst_pairs.size(); ++i) {
    Label label = fst_pairs[i].first;
    MutableFst<Arc> *fst = fst_pairs[i].second;
    nonterminal_hash_[label] = fst_array_.size();
    nonterminal_array_.push_back(label);
    fst_array_.push_back(fst);
    mutable_fst_array_.push_back(fst);
  }
  root_fst_ = nonterminal_hash_[root_label_];
  CHECK(root_fst_);
}

template <class Arc>
ReplaceUtil<Arc>::ReplaceUtil(
    const vector<FstPair> &fst_pairs,
    Label root_label, bool epsilon_on_replace)
    : root_label_(root_label),
      epsilon_on_replace_(epsilon_on_replace),
      depprops_(0) {
  fst_array_.push_back(0);
  nonterminal_array_.push_back(kNoLabel);
  for (Label i = 0; i < fst_pairs.size(); ++i) {
    Label label = fst_pairs[i].first;
    const Fst<Arc> *fst = fst_pairs[i].second;
    nonterminal_hash_[label] = fst_array_.size();
    nonterminal_array_.push_back(label);
    fst_array_.push_back(fst->Copy());
  }
  root_fst_ = nonterminal_hash_[root_label];
  CHECK(root_fst_);
}

template <class Arc>
ReplaceUtil<Arc>::ReplaceUtil(
    const vector<const Fst<Arc> *> &fst_array,
    const NonTerminalHash &nonterminal_hash, Label root_fst,
    bool epsilon_on_replace)
    : root_fst_(root_fst),
      epsilon_on_replace_(epsilon_on_replace),
      nonterminal_array_(fst_array.size()),
      nonterminal_hash_(nonterminal_hash),
      depprops_(0) {
  fst_array_.push_back(0);
  for (Label i = 1; i < fst_array.size(); ++i)
    fst_array_.push_back(fst_array[i]->Copy());
  for (typename NonTerminalHash::const_iterator it =
           nonterminal_hash.begin(); it != nonterminal_hash.end(); ++it)
    nonterminal_array_[it->second] = it->first;
  root_label_ = nonterminal_array_[root_fst_];
}

template <class Arc>
void ReplaceUtil<Arc>::GetDependencies() const {
  if (depfst_.NumStates() > 0)
    return;

  for (Label i = 0; i < fst_array_.size(); ++i) {
    depfst_.AddState();
    depfst_.SetFinal(i, Weight::One());
    stats_.push_back(ReplaceStats());
  }
  depfst_.SetStart(root_fst_);

  // An arc from each state (representing the fst) to the
  // state representing the fst being replaced
  for (Label i = 0; i < fst_array_.size(); ++i) {
    const Fst<Arc> *ifst = fst_array_[i];
    if (!ifst)
      continue;
    for (StateIterator<Fst<Arc> > siter(*ifst); !siter.Done(); siter.Next()) {
      StateId s = siter.Value();
      ++stats_[i].nstates;
      if (ifst->Final(s) != Weight::Zero())
        ++stats_[i].nfinal;
      for (ArcIterator<Fst<Arc> > aiter(*ifst, s);
           !aiter.Done(); aiter.Next()) {
        ++stats_[i].narcs;
        const Arc& arc = aiter.Value();

        typename NonTerminalHash::const_iterator it =
            nonterminal_hash_.find(arc.olabel);
        if (it != nonterminal_hash_.end()) {
          ++stats_[i].nnonterms;
          Label j = it->second;
          ++stats_[j].nref;
          depfst_.AddArc(i, Arc(arc.olabel, arc.olabel, Weight::One(), j));
        }
      }
    }
  }

  // Gets accessibility info
  SccVisitor<Arc> scc_visitor(0, &depaccess_, 0, &depprops_);
  DfsVisit(depfst_, &scc_visitor);
}

template <class Arc>
void ReplaceUtil<Arc>::CheckMutableFsts() {
  if (mutable_fst_array_.size() == 0) {
    for (Label i = 0; i < fst_array_.size(); ++i) {
      if (!fst_array_[i]) {
        mutable_fst_array_.push_back(0);
      } else {
        mutable_fst_array_.push_back(new VectorFst<Arc>(*fst_array_[i]));
        delete fst_array_[i];
        fst_array_[i] = mutable_fst_array_[i];
      }
    }
  }
}

template <class Arc>
void ReplaceUtil<Arc>::Connect() {
  CheckMutableFsts();
  uint64 props = kAccessible | kCoAccessible;
  for (Label i = 0; i < mutable_fst_array_.size(); ++i) {
    if (!mutable_fst_array_[i])
      continue;
    if (mutable_fst_array_[i]->Properties(props, false) != props)
      fst::Connect(mutable_fst_array_[i]);
  }
  GetDependencies();
  for (Label i = 0; i < mutable_fst_array_.size(); ++i) {
    MutableFst<Arc> *fst = mutable_fst_array_[i];
    if (fst && !depaccess_[i]) {
      delete fst;
      fst_array_[i] = 0;
      mutable_fst_array_[i] = 0;
    }
  }
  ClearDependencies();
}

template <class Arc>
void ReplaceUtil<Arc>::ReplaceLabels(const vector<Label> &labels) {
  CheckMutableFsts();
  unordered_set<Label> label_set;
  for (Label i = 0; i < labels.size(); ++i)
    label_set.insert(labels[i]);

  // Finds Fst dependencies restricted to the labels requested.
  GetDependencies();
  VectorFst<Arc> pfst(depfst_);
  for (StateId i = 0; i < pfst.NumStates(); ++i) {
    vector<Arc> arcs;
    for (ArcIterator< VectorFst<Arc> > aiter(pfst, i);
         !aiter.Done(); aiter.Next()) {
      const Arc &arc = aiter.Value();
      Label label = nonterminal_array_[arc.nextstate];
      if (label_set.count(label) > 0)
        arcs.push_back(arc);
    }
    pfst.DeleteArcs(i);
    for (size_t j = 0; j < arcs.size(); ++j)
      pfst.AddArc(i, arcs[j]);
  }

  // Finds topological order of dependencies.
  vector<StateId> order;
  bool acyclic = false;

  TopOrderVisitor<Arc> top_order_visitor(&order, &acyclic);
  DfsVisit(pfst, &top_order_visitor);
  if (!acyclic)
    LOG(FATAL) << "ReplaceUtil::ReplaceLabels: Cyclical label dependencies";

  vector<StateId> inv_order(order.size());
  for (Label i = 0; i < order.size(); ++i)
    inv_order[order[i]] = i;

  // Visits Fsts in reverse topological order of dependencies and
  // performs replacements.
  for (Label i = inv_order.size() - 1; i >= 0;  --i) {
    vector<FstPair> fst_pairs;
    StateId s = inv_order[i];
    for (ArcIterator< VectorFst<Arc> > aiter(pfst, s);
         !aiter.Done(); aiter.Next()) {
      const Arc &arc = aiter.Value();
      Label label = nonterminal_array_[arc.nextstate];
      const Fst<Arc> *fst = fst_array_[arc.nextstate];
      fst_pairs.push_back(make_pair(label, fst));
    }
    if (fst_pairs.empty())
        continue;
    Label label = nonterminal_array_[s];
    const Fst<Arc> *fst = fst_array_[s];
    fst_pairs.push_back(make_pair(label, fst));

    Replace(fst_pairs, mutable_fst_array_[s], label, epsilon_on_replace_);
  }
  ClearDependencies();
}

template <class Arc>
void ReplaceUtil<Arc>::ReplaceTrivial() {
  vector<Label> labels;
  GetDependencies();

  for (Label i = 0; i < fst_array_.size(); ++i) {
    if (stats_[i].nstates <= 2 && stats_[i].narcs <= 1)
      labels.push_back(nonterminal_array_[i]);
  }

  ReplaceLabels(labels);
}

template <class Arc>
void ReplaceUtil<Arc>::ReplaceUnique() {
  vector<Label> labels;
  GetDependencies();

  for (Label i = 0; i < fst_array_.size(); ++i) {
    if (stats_[i].nref == 1)
      labels.push_back(nonterminal_array_[i]);
  }

  ReplaceLabels(labels);
}

template <class Arc>
void ReplaceUtil<Arc>::GetFstPairs(vector<FstPair> *fst_pairs) {
  CheckMutableFsts();
  fst_pairs->clear();
  for (Label i = 0; i < fst_array_.size(); ++i) {
    Label label = nonterminal_array_[i];
    const Fst<Arc> *fst = fst_array_[i];
    if (!fst)
      continue;
    fst_pairs->push_back(make_pair(label, fst));
  }
}

template <class Arc>
void ReplaceUtil<Arc>::GetMutableFstPairs(
    vector<MutableFstPair> *mutable_fst_pairs) {
  CheckMutableFsts();
  mutable_fst_pairs->clear();
  for (Label i = 0; i < mutable_fst_array_.size(); ++i) {
    Label label = nonterminal_array_[i];
    MutableFst<Arc> *fst = mutable_fst_array_[i];
    if (!fst)
      continue;
    mutable_fst_pairs->push_back(make_pair(label, fst->Copy()));
  }
}

}  // namespace fst

#endif  // FST_LIB_REPLACE_UTIL_H__
