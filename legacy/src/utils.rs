pub fn shuffle<T>(source: &mut [T]) {
    use rand::{thread_rng, Rng};
    thread_rng().shuffle(source);
}