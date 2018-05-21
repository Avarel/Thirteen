pub fn shuffle<T>(source: &mut [T]) {
    use rand::{thread_rng, Rng};
    thread_rng().shuffle(source);
}

pub fn shuffle_clone<T: Clone>(source: &[T]) -> Vec<T> {
    let mut copy = source.to_vec();
    shuffle(&mut copy);
    copy
}

#[inline]
pub fn sorted<T: Ord>(mut source: Vec<T>) -> Vec<T> {
    source.sort();
    source
}
