using UnityEngine;

public class ProtestorBounce : MonoBehaviour
{
    public float bounceHeight = 0.5f;      // How high they jump
    public float bounceDuration = 0.2f;    // How quickly they return
    public float minTimeBetweenBounces = 1f;
    public float maxTimeBetweenBounces = 4f;

    private Vector3 originalPosition;
    private bool isBouncing = false;

    void Start()
    {
        originalPosition = transform.localPosition;
        StartCoroutine(BounceRoutine());
    }

    private System.Collections.IEnumerator BounceRoutine()
    {
        while (true)
        {
            // Wait a random amount of time before next bounce
            float waitTime = Random.Range(minTimeBetweenBounces, maxTimeBetweenBounces);
            yield return new WaitForSeconds(waitTime);

            if (!isBouncing)
                StartCoroutine(Bounce());
        }
    }

    private System.Collections.IEnumerator Bounce()
    {
        isBouncing = true;

        // Move up instantly
        transform.localPosition = originalPosition + Vector3.up * bounceHeight;

        // Wait a very short moment (can feel snappy)
        yield return new WaitForSeconds(bounceDuration);

        // Return back to original position
        transform.localPosition = originalPosition;

        isBouncing = false;
    }
}
