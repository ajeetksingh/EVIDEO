// expand.h

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
// Expand a PDT to an FST.

#ifndef FST_EXTENSIONS_PDT_EXPAND_H__
#define FST_EXTENSIONS_PDT_EXPAND_H__

#include <vector>
using std::vector;

#include <fst/extensions/pdt/pdt.h>
#include <fst/cache.h>
#include <fst/mutable-fst.h>
#include <fst/state-table.h>
#include <fst/test-properties.h>

namespace fst {

typedef CacheOptions ExpandFstOptions;

// Properties for an expanded PDT.
inline uint64 ExpandProperties(uint64 inprops) {
  return inprops & (kAcceptor | kAcyclic | kInitialAcyclic | kUnweighted);
}


// Implementation class for ExpandFst
template <class A>
class ExpandFstImpl
    : public CacheImpl<A> {
 public:
  using FstImpl<A>::SetType;
  using FstImpl<A>::SetProperties;
  using FstImpl<A>::Properties;
  using FstImpl<A>::SetInputSymbols;
  using FstImpl<A>::SetOutputSymbols;

  using CacheBaseImpl< CacheState<A> >::AddArc;
  using CacheBaseImpl< CacheState<A> >::HasArcs;
  using CacheBaseImpl< CacheState<A> >::HasFinal;
  using CacheBaseImpl< CacheState<A> >::HasStart;
  using CacheBaseImpl< CacheState<A> >::SetArcs;
  using CacheBaseImpl< CacheState<A> >::SetFinal;
  using CacheBaseImpl< CacheState<A> >::SetStart;

  typedef A Arc;
  typedef typename A::Label Label;
  typedef typename A::Weight Weight;
  typedef typename A::StateId StateId;
  typedef StateId StackId;
  typedef PdtStateTuple<StateId, StackId> StateTuple;

  ExpandFstImpl(const Fst<A> &fst,
                const vector<pair<typename Arc::Label,
                                  typename Arc::Label> > &parens,
                const ExpandFstOptions &opts)
      : CacheImpl<A>(opts), fst_(fst.Copy()),
        stack_(parens) {
    SetType("expand");

    uint64 props = fst.Properties(kFstProperties, false);
    SetProperties(ExpandProperties(props), kCopyProperties);

    SetInputSymbols(fst.InputSymbols());
    SetOutputSymbols(fst.OutputSymbols());
  }

  ExpandFstImpl(const ExpandFstImpl &impl)
      : CacheImpl<A>(impl),
        fst_(impl.fst_->Copy(true)),
        stack_(impl.stack_) {
    SetType("expand");
    SetProperties(impl.Properties(), kCopyProperties);
    SetInputSymbols(impl.InputSymbols());
    SetOutputSymbols(impl.OutputSymbols());
  }

  ~ExpandFstImpl() {
    delete fst_;
  }

  StateId Start() {
    if (!HasStart()) {
      StateId s = fst_->Start();
      if (s == kNoStateId)
        return kNoStateId;
      StateTuple tuple(s, 0);
      StateId start = state_table_.FindState(tuple);
      SetStart(start);
    }
    return CacheImpl<A>::Start();
  }

  Weight Final(StateId s) {
    if (!HasFinal(s)) {
      const StateTuple &tuple = state_table_.Tuple(s);
      Weight w = fst_->Final(tuple.state_id);
      if (w != Weight::Zero() && tuple.stack_id == 0)
        SetFinal(s, w);
      else
        SetFinal(s, Weight::Zero());
    }
    return CacheImpl<A>::Final(s);
  }

  size_t NumArcs(StateId s) {
    if (!HasArcs(s)) {
      ExpandState(s);
    }
    return CacheImpl<A>::NumArcs(s);
  }

  size_t NumInputEpsilons(StateId s) {
    if (!HasArcs(s))
      ExpandState(s);
    return CacheImpl<A>::NumInputEpsilons(s);
  }

  size_t NumOutputEpsilons(StateId s) {
    if (!HasArcs(s))
      ExpandState(s);
    return CacheImpl<A>::NumOutputEpsilons(s);
  }

  void InitArcIterator(StateId s, ArcIteratorData<A> *data) {
    if (!HasArcs(s))
      ExpandState(s);
    CacheImpl<A>::InitArcIterator(s, data);
  }

  // Computes the outgoing transitions from a state, creating new destination
  // states as needed.
  void ExpandState(StateId s) {
    StateTuple tuple = state_table_.Tuple(s);
    for (ArcIterator< Fst<A> > aiter(*fst_, tuple.state_id);
         !aiter.Done(); aiter.Next()) {
      Arc arc = aiter.Value();
      StackId stack_id = stack_.Find(tuple.stack_id, arc.ilabel);
      if (stack_id == -1)                   // Non-matching close parenthesis
        continue;
      else if (stack_id != tuple.stack_id)  // Stack push/pop
        arc.ilabel = arc.olabel = 0;

      StateTuple ntuple(arc.nextstate, stack_id);
      arc.nextstate = state_table_.FindState(ntuple);
      AddArc(s, arc);
    }
    SetArcs(s);
  }

 private:
  const Fst<A> *fst_;

  PdtStateTable<StateId, StackId> state_table_;
  PdtStack<StackId, Label> stack_;

  void operator=(const ExpandFstImpl<A> &);  // disallow
};

// Expands a pushdown transducer (PDT) encoded as an FST into an FST.
// This version is a delayed Fst.  In the PDT, some transitions are
// labeled with open or close parentheses. To be interpreted as a PDT,
// the parens must balance on a path. The open-close parenthesis label
// pairs are passed in 'parens'. The expansion enforces the
// parenthesis constraints. The PDT must be expandable as an FST.
//
// This class attaches interface to implementation and handles
// reference counting, delegating most methods to ImplToFst.
template <class A>
class ExpandFst : public ImplToFst< ExpandFstImpl<A> > {
 public:
  friend class ArcIterator< ExpandFst<A> >;
  friend class StateIterator< ExpandFst<A> >;

  typedef A Arc;
  typedef typename A::Weight Weight;
  typedef typename A::StateId StateId;
  typedef CacheState<A> State;
  typedef ExpandFstImpl<A> Impl;

  ExpandFst(const Fst<A> &fst,
            const vector<pair<typename Arc::Label,
                              typename Arc::Label> > &parens)
      : ImplToFst<Impl>(new Impl(fst, parens, ExpandFstOptions())) {}

  ExpandFst(const Fst<A> &fst,
            const vector<pair<typename Arc::Label,
                              typename Arc::Label> > &parens,
            const ExpandFstOptions &opts)
      : ImplToFst<Impl>(new Impl(fst, parens, opts)) {}

  // See Fst<>::Copy() for doc.
  ExpandFst(const ExpandFst<A> &fst, bool safe = false)
      : ImplToFst<Impl>(fst, safe) {}

  // Get a copy of this ExpandFst. See Fst<>::Copy() for further doc.
  virtual ExpandFst<A> *Copy(bool safe = false) const {
    return new ExpandFst<A>(*this, safe);
  }

  virtual inline void InitStateIterator(StateIteratorData<A> *data) const;

  virtual void InitArcIterator(StateId s, ArcIteratorData<A> *data) const {
    GetImpl()->InitArcIterator(s, data);
  }

 private:
  // Makes visible to friends.
  Impl *GetImpl() const { return ImplToFst<Impl>::GetImpl(); }

  void operator=(const ExpandFst<A> &fst);  // Disallow
};


// Specialization for ExpandFst.
template<class A>
class StateIterator< ExpandFst<A> >
    : public CacheStateIterator< ExpandFst<A> > {
 public:
  explicit StateIterator(const ExpandFst<A> &fst)
      : CacheStateIterator< ExpandFst<A> >(fst, fst.GetImpl()) {}
};


// Specialization for ExpandFst.
template <class A>
class ArcIterator< ExpandFst<A> >
    : public CacheArcIterator< ExpandFst<A> > {
 public:
  typedef typename A::StateId StateId;

  ArcIterator(const ExpandFst<A> &fst, StateId s)
      : CacheArcIterator< ExpandFst<A> >(fst.GetImpl(), s) {
    if (!fst.GetImpl()->HasArcs(s))
      fst.GetImpl()->ExpandState(s);
  }

 private:
  DISALLOW_COPY_AND_ASSIGN(ArcIterator);
};


template <class A> inline
void ExpandFst<A>::InitStateIterator(StateIteratorData<A> *data) const
{
  data->base = new StateIterator< ExpandFst<A> >(*this);
}


// Expands a pushdown transducer (PDT) encoded as an FST into an FST.
// This version writes the expanded PDT result to a MutableFst.
// In the PDT, some transitions are labeled with open or close
// parentheses. To be interpreted as a PDT, the parens must balance on
// a path. The open-close parenthesis label pairs are passed in
// 'parens'. The expansion enforces the parenthesis constraints. The
// PDT must be expandable as an FST.
template<class Arc>
void Expand(const Fst<Arc> &ifst,
             const vector<pair<typename Arc::Label,
                               typename Arc::Label> > &parens,
            MutableFst<Arc> *ofst, bool connect = true) {
  ExpandFstOptions opts;
  opts.gc_limit = 0;
  *ofst = ExpandFst<Arc>(ifst, parens, opts);

  if (connect)
    Connect(ofst);
}

}  // namespace fst

#endif  // FST_EXTENSIONS_PDT_EXPAND_H__
