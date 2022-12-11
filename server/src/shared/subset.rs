pub trait Subsetable<'a, S: Sized> {
    fn as_subset(&'a self) -> S;
}
